"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hash, verify } from "argon2";
import { z } from "zod";
import type { ContentType } from "@prisma/client";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { indexProfile } from "@/lib/search";
import { CONTENT_LABEL } from "@/lib/routes";

/* Actions serveur de l'espace membre : alertes, CV, mot de passe, suppression
   du compte. Chaque action exige une session et n'écrit que sur les lignes
   de l'utilisateur connecté. */

export type ActionState = { error?: string; ok?: boolean };

async function requireUserId(callback: string) {
  const session = await auth();
  if (!session?.user) redirect(`/connexion?callbackUrl=${callback}`);
  return session.user.id;
}

/* --- Alertes ------------------------------------------------------------ */

const CONTENT_TYPES = Object.keys(CONTENT_LABEL) as [ContentType, ...ContentType[]];

const alertSchema = z.object({
  keywords: z.string().trim().min(1, "Indiquez au moins un mot-clé"),
  types: z.array(z.enum(CONTENT_TYPES)).min(1, "Cochez au moins un type de contenu"),
  frequency: z.enum(["INSTANT", "DAILY"]),
});

export async function createAlertAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId("/compte/alertes");

  const parsed = alertSchema.safeParse({
    keywords: formData.get("keywords"),
    types: formData.getAll("types"),
    frequency: formData.get("frequency"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const names = [...new Set(d.keywords.split(",").map((k) => k.trim()).filter(Boolean))].slice(0, 10);
  if (names.length === 0) return { error: "Indiquez au moins un mot-clé" };

  const keywords = await Promise.all(
    names.map((name) => {
      const slug = slugify(name);
      return db.keyword.upsert({
        where: { slug },
        update: {},
        create: { name, slug, family: "THEME" },
        select: { id: true },
      });
    }),
  );

  await db.alert.create({
    data: {
      userId,
      keywordIds: keywords.map((k) => k.id),
      contentTypes: d.types,
      frequency: d.frequency,
    },
  });

  revalidatePath("/compte");
  revalidatePath("/compte/alertes");
  return { ok: true };
}

export async function deleteAlertAction(formData: FormData) {
  const userId = await requireUserId("/compte/alertes");
  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return;

  await db.alert.deleteMany({ where: { id: id.data, userId } });
  revalidatePath("/compte");
  revalidatePath("/compte/alertes");
}

/* --- CV ----------------------------------------------------------------- */

const cvSchema = z.object({
  cvUrl: z.union([z.literal(""), z.url("Adresse du CV invalide (elle doit commencer par https://)")]),
  cvPublished: z.string().optional(),
});

export async function updateCvAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId("/compte/cv");

  const parsed = cvSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (d.cvUrl && !d.cvUrl.startsWith("https://")) return { error: "Le lien du CV doit commencer par https://" };
  if (!d.cvUrl && d.cvPublished === "on") return { error: "Ajoutez un lien vers votre CV avant de le rendre visible" };

  await db.profile.update({
    where: { userId },
    data: { cvUrl: d.cvUrl || null, cvPublished: Boolean(d.cvUrl) && d.cvPublished === "on" },
  });

  revalidatePath("/compte");
  revalidatePath("/compte/cv");
  return { ok: true };
}

/* --- Mot de passe ------------------------------------------------------- */

const passwordSchema = z
  .object({
    current: z.string(),
    next: z.string().min(8, "Le nouveau mot de passe doit faire 8 caractères minimum").max(200),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { message: "Les deux nouveaux mots de passe ne correspondent pas" });

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId("/compte/securite");

  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user?.passwordHash) return { error: "Ce compte n'a pas de mot de passe : il se connecte par lien magique." };
  if (!(await verify(user.passwordHash, d.current))) return { error: "Mot de passe actuel incorrect" };
  if (d.current === d.next) return { error: "Le nouveau mot de passe doit être différent de l'actuel" };

  await db.user.update({ where: { id: userId }, data: { passwordHash: await hash(d.next) } });
  return { ok: true };
}

/* --- Suppression du compte --------------------------------------------- */

export async function deleteAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId("/compte/donnees");

  if (String(formData.get("confirm") ?? "").trim() !== "SUPPRIMER") {
    return { error: "Tapez SUPPRIMER en majuscules pour confirmer" };
  }

  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true, visibility: true } });
  const visibility = ((profile?.visibility as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: {
        status: "DELETED",
        email: `deleted-${userId}@anonyme.invalid`,
        emailVerified: null,
        name: null,
        image: null,
        passwordHash: null,
        twoFactorSecret: null,
      },
    }),
    db.session.deleteMany({ where: { userId } }),
    db.alert.deleteMany({ where: { userId } }),
    ...(profile
      ? [
          db.profile.update({
            where: { id: profile.id },
            data: { visibility: { ...visibility, directory: false }, cvUrl: null, cvPublished: false, phone: null },
          }),
        ]
      : []),
  ]);

  if (profile) await indexProfile(profile.id).catch(() => {});

  await signOut({ redirectTo: "/" });
  return { ok: true };
}

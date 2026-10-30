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
import { put, del } from "@vercel/blob";
import { cvBlobPath, cvRoute, CV_MAX_BYTES } from "@/lib/cv";
import { cookies } from "next/headers";
import { signToken, verifyToken } from "@/lib/signed-token";
import { generateTotpSecret, verifyTotp } from "@/lib/totp";

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
  cvUrl: z.union([z.literal(""), z.string().regex(/^\/api\/cv\/[\w-]+$/), z.url("Adresse du CV invalide (elle doit commencer par https://)")]),
  cvPublished: z.string().optional(),
});


async function removeHostedCv(profileId: string, cvUrl: string | null) {
  if (cvUrl === cvRoute(profileId) && process.env.BLOB_READ_WRITE_TOKEN) {
    await del(cvBlobPath(profileId)).catch((e) => console.error("[cv] suppression Blob impossible", e));
  }
}

export async function updateCvAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId("/compte/cv");
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true, cvUrl: true } });
  if (!profile) return { error: "Profil introuvable" };

  const file = formData.get("cvFile");
  const hosted = profile.cvUrl === cvRoute(profile.id);

  if (file instanceof File && file.size > 0) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return { error: "Le dépôt de fichier n'est pas activé sur ce serveur : collez un lien à la place." };
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) return { error: "Le CV doit être un fichier PDF." };
    if (file.size > CV_MAX_BYTES) return { error: "Le fichier dépasse 3 Mo : allégez votre PDF." };
    await put(cvBlobPath(profile.id), file, { access: "private", contentType: "application/pdf", addRandomSuffix: false, allowOverwrite: true });
    await db.profile.update({ where: { id: profile.id }, data: { cvUrl: cvRoute(profile.id), cvPublished: formData.get("cvPublished") === "on" } });
    revalidatePath("/compte");
    revalidatePath("/compte/cv");
    return { ok: true };
  }

  const parsed = cvSchema.safeParse({ cvUrl: hosted && !formData.get("cvUrl") ? profile.cvUrl : formData.get("cvUrl"), cvPublished: formData.get("cvPublished") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (d.cvUrl && !d.cvUrl.startsWith("https://") && d.cvUrl !== cvRoute(profile.id)) return { error: "Le lien du CV doit commencer par https://" };
  if (!d.cvUrl && d.cvPublished === "on") return { error: "Ajoutez votre CV avant de le rendre visible" };
  if (d.cvUrl !== profile.cvUrl) await removeHostedCv(profile.id, profile.cvUrl);

  await db.profile.update({
    where: { id: profile.id },
    data: { cvUrl: d.cvUrl || null, cvPublished: Boolean(d.cvUrl) && d.cvPublished === "on" },
  });

  revalidatePath("/compte");
  revalidatePath("/compte/cv");
  return { ok: true };
}

export async function removeCvAction(): Promise<void> {
  const userId = await requireUserId("/compte/cv");
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true, cvUrl: true } });
  if (!profile) return;
  await removeHostedCv(profile.id, profile.cvUrl);
  await db.profile.update({ where: { id: profile.id }, data: { cvUrl: null, cvPublished: false } });
  revalidatePath("/compte");
  revalidatePath("/compte/cv");
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

/* Compte créé par lien magique ou importé : définir un premier mot de passe
   (pas de mot de passe actuel à fournir ; la session connectée fait foi). */
const setPasswordSchema = z
  .object({ next: z.string().min(8, "Le mot de passe doit faire 8 caractères minimum").max(200), confirm: z.string() })
  .refine((d) => d.next === d.confirm, { message: "Les deux mots de passe ne correspondent pas" });

export async function setPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId("/compte/securite");
  const parsed = setPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (user?.passwordHash) return { error: "Ce compte a déjà un mot de passe : utilisez « Changer mon mot de passe »." };
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hash(parsed.data.next) } });
  await db.auditLog.create({ data: { userId, action: "user.password_set", entity: "User", entityId: userId } });
  revalidatePath("/compte/securite");
  return { ok: true };
}

/* --- Suppression du compte --------------------------------------------- */

export async function deleteAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId("/compte/donnees");

  if (String(formData.get("confirm") ?? "").trim() !== "SUPPRIMER") {
    return { error: "Tapez SUPPRIMER en majuscules pour confirmer" };
  }

  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true, visibility: true, cvUrl: true } });
  if (profile) await removeHostedCv(profile.id, profile.cvUrl);
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

/* --- Double authentification (TOTP) ---------------------------------------
   Réservée aux rôles de l'équipe (accès /admin). Le secret ne touche la base
   qu'une fois un premier code validé ; en attendant il voyage dans un cookie
   signé de 10 minutes. */

const STAFF_2FA = new Set(["EDITOR", "MODERATOR", "REGIE", "ADMIN"]);

export async function startTwoFactorAction() {
  const session = await auth();
  if (!session?.user || !STAFF_2FA.has(session.user.role ?? "")) redirect("/compte/securite");
  const jar = await cookies();
  jar.set("bdm_2fa_setup", signToken({ purpose: "2fa-setup", uid: session.user.id, secret: generateTotpSecret() }, 600), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  redirect("/compte/securite/2fa");
}

export async function confirmTwoFactorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId("/compte/securite");
  const jar = await cookies();
  const setup = verifyToken<{ uid: string; secret: string }>(jar.get("bdm_2fa_setup")?.value, "2fa-setup");
  if (!setup || setup.uid !== userId) return { error: "Délai dépassé : relancez l'activation." };
  if (!verifyTotp(setup.secret, String(formData.get("code") ?? ""))) return { error: "Code incorrect. Vérifiez l'heure de votre téléphone et réessayez." };
  await db.user.update({ where: { id: userId }, data: { twoFactorSecret: setup.secret } });
  await db.auditLog.create({ data: { userId, action: "user.2fa_on", entity: "User", entityId: userId } });
  jar.delete("bdm_2fa_setup");
  revalidatePath("/compte/securite");
  return { ok: true };
}

export async function disableTwoFactorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId("/compte/securite");
  const u = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true, twoFactorSecret: true } });
  if (!u?.twoFactorSecret) return { error: "La double authentification n'est pas active." };
  if (!u.passwordHash || !(await verify(u.passwordHash, String(formData.get("password") ?? "")))) return { error: "Mot de passe incorrect." };
  if (!verifyTotp(u.twoFactorSecret, String(formData.get("code") ?? ""))) return { error: "Code incorrect." };
  await db.user.update({ where: { id: userId }, data: { twoFactorSecret: null } });
  await db.auditLog.create({ data: { userId, action: "user.2fa_off", entity: "User", entityId: userId } });
  revalidatePath("/compte/securite");
  return { ok: true };
}

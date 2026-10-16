"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import { hash } from "argon2";
import { z } from "zod";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { slugify } from "@/lib/slug";

/* Actions serveur : connexion, lien magique, inscription, déconnexion.
   Les erreurs reviennent par l'URL (?erreur=…) pour rester en composants
   serveur ; les messages sont rendus par les pages. */

const emailSchema = z.email();

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const brut = String(formData.get("suite") ?? "");
  const suite = brut.startsWith("/") && !brut.startsWith("//") ? brut : "/compte";

  try {
    await signIn("credentials", { email, password, redirectTo: suite });
  } catch (e) {
    if (e instanceof CredentialsSignin) {
      redirect(`/connexion?erreur=${e.code === "email_non_confirme" ? "email_non_confirme" : "identifiants"}`);
    }
    if (e instanceof AuthError) redirect("/connexion?erreur=auth");
    throw e;
  }
}

export async function magicLinkAction(formData: FormData) {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) redirect("/connexion?erreur=email");

  try {
    await signIn("resend", { email: parsed.data, redirectTo: "/compte" });
  } catch (e) {
    if (e instanceof AuthError) redirect("/connexion?erreur=auth");
    throw e;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

const registerSchema = z
  .object({
    accountType: z.enum(["MEMBER", "COMPANY", "ASSOCIATION", "ARTIST"]),
    prenom: z.string().trim().min(1, "Prénom obligatoire").max(80),
    nom: z.string().trim().min(1, "Nom obligatoire").max(80),
    email: z.email("Adresse e-mail invalide"),
    pays: z.string().trim().min(1, "Pays obligatoire").max(80),
    ville: z.string().trim().min(1, "Ville obligatoire").max(80),
    secteur: z.string().trim().max(80).optional(),
    password: z.string().min(8, "8 caractères minimum").max(200),
    password2: z.string(),
    cgu: z.literal("on", { error: "Vous devez accepter les CGU" }),
    annuaire: z.string().optional(),
    newsletter: z.string().optional(),
  })
  .refine((d) => d.password === d.password2, {
    path: ["password2"],
    message: "Les deux mots de passe ne correspondent pas",
  });

export type RegisterState = { error?: string; champ?: string };

export async function registerAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, champ: String(issue.path[0] ?? "") };
  }
  const d = parsed.data;
  const email = d.email.toLowerCase();

  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "Un compte existe déjà avec cette adresse — connectez-vous.", champ: "email" };
  }

  const displayName = d.accountType === "MEMBER" ? `${d.prenom} ${d.nom.charAt(0)}.` : `${d.prenom} ${d.nom}`.trim();
  const base = slugify(displayName) || "membre";
  const taken = await db.profile.count({ where: { slug: { startsWith: base } } });
  const slug = taken ? `${base}-${taken + 1}` : base;

  await db.user.create({
    data: {
      email,
      name: `${d.prenom} ${d.nom}`,
      passwordHash: await hash(d.password),
      accountType: d.accountType,
      status: "PENDING_EMAIL",
      profile: {
        create: {
          displayName,
          slug,
          country: d.pays,
          city: d.ville,
          visibility: { directory: d.annuaire === "on" },
          ...(d.secteur && {
            keywords: {
              create: [
                {
                  keyword: {
                    connectOrCreate: {
                      where: { slug: slugify(d.secteur) },
                      create: { name: d.secteur, slug: slugify(d.secteur), family: "SECTOR" },
                    },
                  },
                },
              ],
            },
          }),
        },
      },
    },
  });

  if (d.newsletter === "on") {
    await db.subscriber.upsert({ where: { email }, update: {}, create: { email } });
  }

  // Le lien magique sert de confirmation d'adresse (le compte passe ACTIVE au clic)
  try {
    await signIn("resend", { email, redirect: false, redirectTo: "/compte" });
  } catch (e) {
    if (!(e instanceof AuthError)) throw e;
  }
  redirect("/connexion?inscrit=1");
}

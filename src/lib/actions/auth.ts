"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import { hash, verify } from "argon2";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { signToken, verifyToken } from "@/lib/signed-token";
import { verifyTotp } from "@/lib/totp";

/* Actions serveur : connexion, lien magique, inscription, déconnexion.
   Les erreurs reviennent par l'URL (?erreur=…) pour rester en composants
   serveur ; les messages sont rendus par les pages. */

const emailSchema = z.email();

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const ip = await clientIp();
  if (!(await rateLimit(`login:${ip}`, 10, 900)) || !(await rateLimit(`login:${email}`, 5, 900))) redirect("/connexion?erreur=trop");
  const password = String(formData.get("password") ?? "");
  const brut = String(formData.get("suite") ?? "");
  const suite = brut.startsWith("/") && !brut.startsWith("//") ? brut : "/compte";

  /* Double authentification : si le compte a un secret TOTP, le mot de passe est
     vérifié ici, puis un jeton signé (5 min) ouvre la page du code. */
  const u = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true, twoFactorSecret: true, status: true } });
  if (u?.twoFactorSecret && u.passwordHash && u.status === "ACTIVE") {
    if (!(await verify(u.passwordHash, password))) redirect("/connexion?erreur=identifiants");
    const jar = await cookies();
    jar.set("bdm_2fa", signToken({ purpose: "2fa-pending", uid: u.id, suite }, 300), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 300 });
    redirect("/connexion/code");
  }

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
  if (!(await rateLimit(`magic:${await clientIp()}`, 5, 900)) || !(await rateLimit(`magic:${parsed.data}`, 3, 3600))) redirect("/connexion?erreur=trop");

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
  const ip = await clientIp();
  if (!(await rateLimit(`register:${ip}`, 5, 3600))) return { error: "Trop de tentatives depuis votre connexion : réessayez dans une heure." };
  if (!(await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip))) return { error: "Vérification anti-robot échouée : rechargez la page et réessayez." };
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

/* Étape 2 de la connexion : le code de l'application d'authentification. */
export async function twoFactorLoginAction(formData: FormData) {
  const jar = await cookies();
  const pending = verifyToken<{ uid: string; suite: string }>(jar.get("bdm_2fa")?.value, "2fa-pending");
  if (!pending) redirect("/connexion?erreur=2fa_expire");
  if (!(await rateLimit(`2fa:${pending.uid}`, 5, 900))) redirect("/connexion?erreur=trop");
  const u = await db.user.findUnique({ where: { id: pending.uid }, select: { twoFactorSecret: true } });
  const code = String(formData.get("code") ?? "");
  if (!u?.twoFactorSecret || !verifyTotp(u.twoFactorSecret, code)) redirect("/connexion/code?erreur=code");
  jar.delete("bdm_2fa");
  const suite = pending.suite?.startsWith("/") && !pending.suite.startsWith("//") ? pending.suite : "/compte";
  try {
    await signIn("two-factor", { token: signToken({ purpose: "2fa-ok", uid: pending.uid }, 60), redirectTo: suite });
  } catch (e) {
    if (e instanceof AuthError) redirect("/connexion?erreur=auth");
    throw e;
  }
}

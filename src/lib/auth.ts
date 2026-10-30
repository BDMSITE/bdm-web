import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { verify } from "argon2";
import { z } from "zod";
import { db } from "./db";
import { sendMagicLink, sendInvitation } from "./mail";
import { authConfig } from "./auth.config";
import { verifyToken } from "./signed-token";

/* Auth.js : e-mail + mot de passe (Argon2) et lien magique (Resend).
   Sessions JWT (obligatoire avec le fournisseur Credentials) ; l'adaptateur
   Prisma sert aux jetons de lien magique et aux futurs comptes OAuth.
   Le lien magique vaut aussi confirmation d'adresse : le compte passe ACTIVE. */

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

class EmailNonConfirme extends CredentialsSignin {
  code = "email_non_confirme";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user?.passwordHash) return null;
        if (!(await verify(user.passwordHash, parsed.data.password))) return null;
        if (user.status === "PENDING_EMAIL") throw new EmailNonConfirme();
        if (user.status !== "ACTIVE") return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          accountType: user.accountType,
        };
      },
    }),
    Credentials({
      id: "two-factor",
      credentials: { token: {} },
      /* Deuxième étape : loginAction a déjà vérifié le mot de passe puis le code
         TOTP ; le jeton signé (5 min) prouve ces deux vérifications. */
      async authorize(raw) {
        const p = verifyToken<{ uid: string }>(typeof raw?.token === "string" ? raw.token : undefined, "2fa-ok");
        if (!p?.uid) return null;
        const user = await db.user.findUnique({ where: { id: p.uid } });
        if (!user || user.status !== "ACTIVE") return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role, accountType: user.accountType };
      },
    }),
    Resend({
      from: process.env.EMAIL_FROM,
      // Compte importé jamais activé → e-mail d'invitation ; sinon lien de connexion
      async sendVerificationRequest({ identifier, url }) {
        const user = await db.user.findUnique({
          where: { email: identifier },
          select: { status: true, importedFrom: true, profile: { select: { displayName: true } } },
        });
        if (user?.status === "PENDING_EMAIL" && user.importedFrom) {
          return sendInvitation(identifier, user.profile?.displayName ?? "", url);
        }
        return sendMagicLink(identifier, url);
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Lien magique : un compte suspendu ou supprimé ne rentre pas
    async signIn({ user, account }) {
      if (account?.provider !== "resend" || !user.email) return true;
      const u = await db.user.findUnique({ where: { email: user.email }, select: { status: true } });
      return !u || (u.status !== "SUSPENDED" && u.status !== "DELETED");
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "resend" && user.id) {
        await db.user.updateMany({
          where: { id: user.id, status: "PENDING_EMAIL" },
          data: { status: "ACTIVE", emailVerified: new Date() },
        });
        if (user.email) await db.subscriber.updateMany({ where: { email: user.email, confirmedAt: null }, data: { confirmedAt: new Date() } });
      }
    },
  },
});

import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { verify } from "argon2";
import { z } from "zod";
import { db } from "./db";
import { sendMagicLink, sendInvitation } from "./mail";
import { authConfig } from "./auth.config";

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
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "resend" && user.id) {
        await db.user.update({
          where: { id: user.id },
          data: { status: "ACTIVE", emailVerified: new Date() },
        });
      }
    },
  },
});

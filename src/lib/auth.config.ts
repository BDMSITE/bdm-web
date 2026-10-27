import type { NextAuthConfig } from "next-auth";
import type { AccountType, Role } from "@prisma/client";

/* Partie de la config Auth.js sans accès base : partagée entre auth.ts
   (serveur, avec adaptateur + fournisseurs) et proxy.ts (protection des
   routes, qui ne lit que le JWT). */

const STAFF_ROLES = new Set(["EDITOR", "MODERATOR", "REGIE", "ADMIN"]);
/* Le rôle Régie ne voit que la régie publicitaire. */
const REGIE_ONLY = ["/admin/regie"];

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
    verifyRequest: "/connexion?envoye=1",
    error: "/connexion?erreur=auth",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin")) {
        if (!auth?.user) return false;
        if (!STAFF_ROLES.has(auth.user.role ?? "")) {
          return Response.redirect(new URL("/compte?acces=refuse", request.nextUrl));
        }
        if (auth.user.role === "REGIE" && !REGIE_ONLY.some((p) => pathname.startsWith(p))) {
          return Response.redirect(new URL("/admin/regie", request.nextUrl));
        }
      }
      if (pathname.startsWith("/compte")) return !!auth?.user;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.accountType = user.accountType;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = token.role as Role | undefined;
      session.user.accountType = token.accountType as AccountType | undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;

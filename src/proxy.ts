import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/* Protection des routes (Next 16 : proxy = ex-middleware). Ne lit que le
   JWT de session, sans base de données : /compte/* exige d'être connecté,
   /admin/* exige un rôle rédaction, modération ou admin. */

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/compte/:path*", "/admin/:path*"],
};

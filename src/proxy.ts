import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig, STAFF_ROLES, REGIE_ONLY } from "@/lib/auth.config";

/* Protection des routes (Next 16 : proxy = ex-middleware). Ne lit que le JWT de
   session, sans base de données : /compte/* exige d'être connecté, /admin/* exige un
   rôle d'équipe (Régie : seulement /admin/regie). Transmet aussi le chemin demandé au
   layout racine (en-tête x-pathname) pour le mode maintenance.
   Les règles sont appliquées ici explicitement : avec la forme auth(fn), le callback
   « authorized » n'est pas appliqué automatiquement. */

export default NextAuth(authConfig).auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;
  const connexion = () => NextResponse.redirect(new URL(`/connexion?callbackUrl=${encodeURIComponent(pathname)}`, req.nextUrl));

  if (pathname.startsWith("/admin")) {
    if (!user) return connexion();
    if (!STAFF_ROLES.has(user.role ?? "")) return NextResponse.redirect(new URL("/compte?acces=refuse", req.nextUrl));
    if (user.role === "REGIE" && !REGIE_ONLY.some((p) => pathname.startsWith(p))) return NextResponse.redirect(new URL("/admin/regie", req.nextUrl));
  }
  if (pathname.startsWith("/compte") && !user) return connexion();

  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|pub/|icons/|manifest.webmanifest|robots.txt|sitemap.xml|flux.xml|api/).*)"],
};

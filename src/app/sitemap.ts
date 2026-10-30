import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { contentHref } from "@/lib/routes";

/* Plan du site pour les moteurs : pages fixes + tous les contenus publiés
   + fiches membres visibles dans l'annuaire. Régénéré à chaque demande. */

const FIXES = ["/", "/magazine", "/magazine/beninois-qui-comptent", "/retour-au-pays", "/memoire", "/en/roots", "/emploi", "/emploi/recruteurs", "/communaute", "/communaute/membres", "/communaute/entreprises", "/communaute/associations", "/communaute/artistes", "/communaute/competences", "/adresses", "/agenda", "/bons-plans", "/annonces", "/pratique/chercher-trouver", "/pratique/accueil", "/publier", "/hcbe", "/annonceurs", "/contact", "/legal/mentions-legales", "/legal/confidentialite", "/legal/cgu"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://bdm-web-psi.vercel.app";
  const [contents, profiles] = await Promise.all([
    db.content.findMany({ where: { status: "PUBLISHED" }, select: { type: true, slug: true, updatedAt: true } }).catch(() => []),
    db.profile.findMany({ where: { user: { status: "ACTIVE" }, visibility: { path: ["directory"], equals: true } }, select: { slug: true, updatedAt: true } }).catch(() => []),
  ]);
  return [
    ...FIXES.map((p) => ({ url: `${base}${p}`, changeFrequency: "daily" as const, priority: p === "/" ? 1 : 0.7 })),
    ...contents.map((c) => ({ url: `${base}${contentHref(c.type, c.slug)}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...profiles.map((p) => ({ url: `${base}/communaute/membres/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.4 })),
  ];
}

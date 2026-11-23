import type { MetadataRoute } from "next";
import { maintenance } from "@/lib/settings";

/* Robots : tout le site public est indexable ; l'espace membre, l'admin et
   les routes techniques ne le sont pas. Site fermé aux visiteurs (mode
   maintenance) : on interdit tout, pour ne pas faire crawler des pages
   « noindex » (voir aussi sitemap.ts, flux.xml et /agenda/ical). */
export const revalidate = 300;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://bdm-web-psi.vercel.app";
  if ((await maintenance()).on) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/compte", "/api", "/connexion", "/inscription", "/recherche"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}

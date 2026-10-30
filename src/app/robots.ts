import type { MetadataRoute } from "next";

/* Robots : tout le site public est indexable ; l'espace membre, l'admin et
   les routes techniques ne le sont pas. */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://bdm-web-psi.vercel.app";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/compte", "/api", "/connexion", "/inscription", "/recherche"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}

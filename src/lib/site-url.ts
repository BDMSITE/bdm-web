/* URL publique du site, une seule source pour les e-mails, le sitemap et les liens absolus. */
export const SITE_URL = (process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://bdm-web-psi.vercel.app").replace(/\/$/, "");

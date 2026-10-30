import type { NextConfig } from "next";

/* Content-Security-Policy : ce que le site charge réellement.
   - scripts : le site (Next inline) + Cloudflare Turnstile
   - connexions : tuiles OpenStreetMap (carte), Blob Vercel (visuels pub, CV), Vercel Analytics
   - images : le site, data/blob, tout https (visuels d'annonceurs, photos externes)
   - workers blob: (MapLibre) ; cadres : Turnstile seulement ; jamais encadré ailleurs.
   Désactivée en dev (Turbopack/webpack injectent de l'eval). */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://tile.openstreetmap.org https://*.public.blob.vercel-storage.com https://challenges.cloudflare.com https://vitals.vercel-insights.com",
  "worker-src 'self' blob:",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: csp }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async redirects() {
    return [
      { source: "/avantages", destination: "/bons-plans", permanent: true },
      { source: "/avantages/:slug", destination: "/bons-plans/:slug", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;

import { db } from "@/lib/db";
import { contentHref, CONTENT_LABEL } from "@/lib/routes";

/* Flux RSS : les 30 derniers contenus publiés (articles, offres, événements…).
   Lisible par n8n, les agrégateurs et les lecteurs de flux. */

export const revalidate = 900;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

export async function GET() {
  const base = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://bdm-web-psi.vercel.app";
  const items = await db.content.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 30,
    select: { title: true, slug: true, type: true, excerpt: true, publishedAt: true, city: true, country: true },
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Béninois du Monde</title>
<link>${base}</link>
<description>Le média et le réseau des Béninois où qu'ils vivent.</description>
<language>fr</language>
${items
  .map(
    (i) => `<item><title>${esc(`[${CONTENT_LABEL[i.type]}] ${i.title}`)}</title><link>${base}${contentHref(i.type, i.slug)}</link><guid>${base}${contentHref(i.type, i.slug)}</guid>${i.publishedAt ? `<pubDate>${new Date(i.publishedAt).toUTCString()}</pubDate>` : ""}<description>${esc([i.excerpt ?? "", [i.city, i.country].filter(Boolean).join(", ")].filter(Boolean).join(" — "))}</description></item>`,
  )
  .join("\n")}
</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=900" } });
}

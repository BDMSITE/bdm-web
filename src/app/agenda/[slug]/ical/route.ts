import { db } from "@/lib/db";
import { buildIcs } from "@/lib/temps";
import { SITE_URL } from "@/lib/site-url";

/* Fichier .ics d'un événement : « Ajouter à mon agenda » (Apple, Outlook, Android…). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await db.content.findFirst({ where: { slug, type: "EVENT", status: "PUBLISHED" }, include: { event: true } });
  if (!c?.event) return new Response("Événement introuvable", { status: 404 });
  const url = `${SITE_URL}/agenda/${c.slug}`;
  const ics = buildIcs([
    {
      uid: `${c.id}@beninois-du-monde`,
      title: c.title,
      description: c.excerpt ?? undefined,
      location: c.event.isOnline ? "En ligne" : [c.event.venue, c.city, c.country].filter(Boolean).join(", "),
      url,
      startsAt: c.event.startsAt,
      endsAt: c.event.endsAt,
      updatedAt: c.updatedAt,
    },
  ]);
  return new Response(ics, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${c.slug}.ics"`, "Cache-Control": "public, max-age=900" },
  });
}

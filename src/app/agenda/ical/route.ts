import { db } from "@/lib/db";
import { buildIcs } from "@/lib/temps";
import { SITE_URL } from "@/lib/site-url";

/* Calendrier iCal de tous les événements à venir : abonnable dans Google Agenda, Apple
   Calendrier ou Outlook (« S'abonner à un calendrier » avec cette adresse). */
export const revalidate = 900;

export async function GET() {
  const depuis = new Date(Date.now() - 864e5);
  const items = await db.content.findMany({
    where: { type: "EVENT", status: "PUBLISHED", event: { startsAt: { gte: depuis } } },
    include: { event: true },
    orderBy: { event: { startsAt: "asc" } },
    take: 300,
  });
  const ics = buildIcs(
    items.flatMap((c) =>
      c.event
        ? [{
            uid: `${c.id}@beninois-du-monde`,
            title: c.title,
            description: c.excerpt ?? undefined,
            location: c.event.isOnline ? "En ligne" : [c.event.venue, c.city, c.country].filter(Boolean).join(", "),
            url: `${SITE_URL}/agenda/${c.slug}`,
            startsAt: c.event.startsAt,
            endsAt: c.event.endsAt,
            updatedAt: c.updatedAt,
          }]
        : [],
    ),
    "Béninois du Monde — Agenda",
  );
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "public, max-age=900" } });
}

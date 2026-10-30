import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { SLOTS } from "@/lib/pub-slots";

/* Rapport annonceurs (CSV) : affichages et clics par campagne et par jour sur les 90
   derniers jours, pour l'équipe (rédaction, modération, administration). */

const STAFF = new Set(["EDITOR", "MODERATOR", "ADMIN"]);

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !STAFF.has(session.user.role ?? "")) return new Response("Réservé à l'équipe.", { status: 403 });
  const jours = Math.min(366, Math.max(7, Number(new URL(req.url).searchParams.get("jours") ?? 90) || 90));
  const depuis = new Date(Date.now() - jours * 864e5);
  const stats = await db.bannerStat.findMany({
    where: { day: { gte: depuis } },
    orderBy: [{ day: "asc" }],
    include: { banner: { select: { title: true, advertiser: true, slot: true, house: true, status: true } } },
  });
  const slotLabel = new Map(SLOTS.map((s) => [s.code, s.label]));
  const rows = stats.map((s) => [
    s.day,
    s.banner.advertiser,
    s.banner.title,
    slotLabel.get(s.banner.slot) ?? s.banner.slot,
    s.banner.house ? "maison" : "vendue",
    s.impressions,
    s.clicks,
    s.impressions ? ((s.clicks / s.impressions) * 100).toFixed(2).replace(".", ",") : "0",
  ]);
  return csvResponse(`regie-${jours}j-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(["Jour", "Annonceur", "Campagne", "Emplacement", "Type", "Affichages", "Clics", "Taux de clic %"], rows));
}

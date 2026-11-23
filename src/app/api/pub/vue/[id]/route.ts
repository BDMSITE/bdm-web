import { db } from "@/lib/db";
import { recordImpression } from "@/lib/pub";
import { clientIp, rateLimit } from "@/lib/ratelimit";

/* Balise d'affichage : le carrousel signale chaque campagne réellement montrée
   (une fois par campagne et par page). Réponse vide, jamais mise en cache.
   Les statistiques servent à facturer les annonceurs : on plafonne donc à
   30 affichages par heure, par IP et par campagne, pour qu'un robot ne puisse
   pas les gonfler. Au-delà, la réponse reste la même, seul le comptage s'arrête. */

const MAX_PAR_HEURE = 30;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (/^[\w-]+$/.test(id) && (await db.banner.count({ where: { id, status: "PUBLISHED" } }))) {
    if (await rateLimit(`pub-vue:${await clientIp()}:${id}`, MAX_PAR_HEURE, 3600)) recordImpression(id);
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

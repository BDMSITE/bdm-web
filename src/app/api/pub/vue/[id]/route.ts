import { db } from "@/lib/db";
import { recordImpression } from "@/lib/pub";

/* Balise d'affichage : le carrousel signale chaque campagne réellement montrée
   (une fois par campagne et par page). Réponse vide, jamais mise en cache. */

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (/^[\w-]+$/.test(id) && (await db.banner.count({ where: { id, status: "PUBLISHED" } }))) recordImpression(id);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

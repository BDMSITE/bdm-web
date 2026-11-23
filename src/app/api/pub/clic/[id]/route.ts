import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordClick } from "@/lib/pub";
import { clientIp, rateLimit } from "@/lib/ratelimit";

/* Clic sur une publicité : comptage puis redirection vers le site de l'annonceur.
   Seuls les liens http(s) de campagnes existantes sont suivis. */

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[\w-]+$/.test(id)) return NextResponse.redirect(new URL("/", _req.url));
  const b = await db.banner.findUnique({ where: { id }, select: { link: true } });
  if (!b || !/^https?:\/\//i.test(b.link)) return NextResponse.redirect(new URL("/", _req.url));
  /* Plafond de comptage (10 clics par heure, par IP et par campagne) : le visiteur
     est toujours redirigé, mais un robot ne peut pas fausser la facturation. */
  if (await rateLimit(`pub-clic:${await clientIp()}:${id}`, 10, 3600)) await recordClick(id);
  return NextResponse.redirect(b.link, { status: 302, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}

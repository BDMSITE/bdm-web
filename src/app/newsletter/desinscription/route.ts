import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readEmailToken } from "@/lib/newsletter";
import { SITE_URL } from "@/lib/site-url";

/* Désinscription en un clic depuis chaque lettre : l'adresse est supprimée de la liste. */
export async function GET(req: Request) {
  const email = readEmailToken(new URL(req.url).searchParams.get("jeton") ?? undefined, "nl-unsub");
  if (!email) return NextResponse.redirect(`${SITE_URL}/newsletter?erreur=jeton`);
  await db.subscriber.deleteMany({ where: { email } });
  return NextResponse.redirect(`${SITE_URL}/newsletter?desinscrit=1`);
}

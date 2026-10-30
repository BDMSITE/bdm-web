import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readEmailToken } from "@/lib/newsletter";
import { SITE_URL } from "@/lib/site-url";

/* Double confirmation : le lien reçu par e-mail confirme l'adresse. */
export async function GET(req: Request) {
  const email = readEmailToken(new URL(req.url).searchParams.get("jeton") ?? undefined, "nl-confirm");
  if (!email) return NextResponse.redirect(`${SITE_URL}/newsletter?erreur=jeton`);
  await db.subscriber.upsert({ where: { email }, update: { confirmedAt: new Date() }, create: { email, confirmedAt: new Date() } });
  return NextResponse.redirect(`${SITE_URL}/newsletter?confirme=1`);
}

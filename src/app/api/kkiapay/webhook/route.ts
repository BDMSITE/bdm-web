import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseEvent, webhookMode } from "@/lib/kkiapay";
import { confirmerPaiement } from "@/lib/adhesion-paiement";

/* Webhook KKiaPay : à déclarer dans le tableau de bord (Développeurs → Clés API → Webhook) avec
   l'URL https://beninois-du-monde.com/api/kkiapay/webhook, l'événement « transaction.success »
   et un hash secret ; ce hash va dans KKIAPAY_SANDBOX_WEBHOOK_SECRET ou KKIAPAY_LIVE_WEBHOOK_SECRET
   et arrive dans l'en-tête X-KKIAPAY-SECRET. Le contenu du webhook ne fait pas foi : la transaction
   est relue auprès de KKiaPay avant toute activation. Toujours répondre 2xx une fois reçu, sinon
   KKiaPay réessaie 5 fois. */

export async function POST(req: Request) {
  if (!process.env.KKIAPAY_SANDBOX_WEBHOOK_SECRET && !process.env.KKIAPAY_LIVE_WEBHOOK_SECRET) return NextResponse.json({ error: "Webhook non configuré" }, { status: 503 });
  const mode = webhookMode(req.headers.get("x-kkiapay-secret"));
  if (!mode) return NextResponse.json({ error: "Secret invalide" }, { status: 400 });
  const event = parseEvent(await req.text());
  if (!event?.transactionId) return NextResponse.json({ error: "Événement illisible" }, { status: 400 });

  const membershipId = typeof event.stateData === "string" ? event.stateData : null;
  const m = membershipId
    ? await db.membership.findUnique({ where: { id: membershipId }, select: { id: true } })
    : await db.membership.findUnique({ where: { paymentRef: event.transactionId }, select: { id: true } });
  if (!m) return NextResponse.json({ ok: true, ignore: "adhésion inconnue" });

  if (event.event === "transaction.success" || event.isPaymentSucces === true) {
    const r = await confirmerPaiement(m.id, event.transactionId, mode);
    return NextResponse.json({ ok: true, resultat: r });
  }
  return NextResponse.json({ ok: true, ignore: event.event ?? "échec" });
}

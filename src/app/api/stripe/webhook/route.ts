import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseStripeEvent, stripeWebhookMode } from "@/lib/stripe";
import { confirmerStripe } from "@/lib/adhesion-paiement";

/* Webhook Stripe : à déclarer dans le tableau de bord Stripe (Développeurs → Webhooks, en test et en
   live) avec l'URL https://beninois-du-monde.com/api/stripe/webhook et l'événement
   checkout.session.completed (+ checkout.session.async_payment_succeeded) ; le secret « whsec_… »
   va dans STRIPE_TEST_WEBHOOK_SECRET / STRIPE_LIVE_WEBHOOK_SECRET. Signature vérifiée sur le corps
   brut, puis la session est relue à la source avant toute activation. */

export async function POST(req: Request) {
  if (!process.env.STRIPE_TEST_WEBHOOK_SECRET && !process.env.STRIPE_LIVE_WEBHOOK_SECRET) return NextResponse.json({ error: "Webhook non configuré" }, { status: 503 });
  const raw = await req.text();
  const mode = stripeWebhookMode(raw, req.headers.get("stripe-signature"));
  if (!mode) return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  const event = parseStripeEvent(raw);
  if (!event) return NextResponse.json({ error: "Événement illisible" }, { status: 400 });
  if (!event.type.startsWith("checkout.session.")) return NextResponse.json({ ok: true, ignore: event.type });

  const sess = event.data.object;
  const membershipId = sess.metadata?.membershipId ?? sess.client_reference_id ?? null;
  const m = membershipId
    ? await db.membership.findUnique({ where: { id: membershipId }, select: { id: true, paymentRef: true } })
    : await db.membership.findUnique({ where: { paymentRef: sess.id }, select: { id: true, paymentRef: true } });
  if (!m || (m.paymentRef && m.paymentRef !== sess.id)) return NextResponse.json({ ok: true, ignore: "adhésion inconnue" });

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const r = await confirmerStripe(m.id, mode);
    return NextResponse.json({ ok: true, resultat: r });
  }
  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    await db.membership.updateMany({ where: { id: m.id, status: "PENDING" }, data: { status: "CANCELLED", note: `Stripe : ${event.type.split(".").pop()}` } });
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseEvent, verifyWebhookSignature, getTransaction } from "@/lib/fedapay";
import { finaliserPaiement } from "@/lib/adhesion-paiement";

/* Webhook FedaPay : à déclarer dans le tableau de bord FedaPay (Workbench → Webhooks) avec
   l'URL https://beninois-du-monde.com/api/fedapay/webhook ; le secret de l'endpoint va dans
   FEDAPAY_WEBHOOK_SECRET. Signature vérifiée sur le corps brut, puis la transaction est relue
   à la source avant toute activation (le contenu du webhook ne fait pas foi à lui seul). */

export async function POST(req: Request) {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook non configuré" }, { status: 503 });
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-fedapay-signature"), secret)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }
  const event = parseEvent(raw);
  if (!event) return NextResponse.json({ error: "Événement illisible" }, { status: 400 });
  const tx = event.entity ?? event.object;
  if (!event.name.startsWith("transaction.") || !tx?.id) return NextResponse.json({ ok: true, ignore: event.name });

  const paymentRef = String(tx.id);
  const m = await db.membership.findUnique({ where: { paymentRef }, select: { id: true, status: true, amount: true } });
  if (!m) return NextResponse.json({ ok: true, ignore: "transaction inconnue" });

  if (event.name === "transaction.approved" || event.name === "transaction.transferred") {
    if (m.status === "ACTIVE") return NextResponse.json({ ok: true, deja: true });
    const verite = await getTransaction(paymentRef).catch(() => null);
    if (!verite || (verite.status !== "approved" && verite.status !== "transferred")) return NextResponse.json({ ok: true, attente: true });
    if (verite.amount !== m.amount) {
      console.error("[fedapay] montant inattendu", { paymentRef, attendu: m.amount, recu: verite.amount });
      return NextResponse.json({ error: "Montant inattendu" }, { status: 409 });
    }
    await finaliserPaiement(m.id, verite.mode);
    return NextResponse.json({ ok: true, active: true });
  }
  if ((event.name === "transaction.declined" || event.name === "transaction.canceled") && m.status === "PENDING") {
    await db.membership.update({ where: { id: m.id }, data: { status: "CANCELLED", note: `Paiement ${event.name.split(".")[1]} (webhook)` } });
  }
  return NextResponse.json({ ok: true });
}

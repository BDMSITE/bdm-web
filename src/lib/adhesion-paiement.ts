import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site-url";
import { verifyTransaction, modeLabel, type KkiaMode } from "@/lib/kkiapay";
import { getCheckoutSession, type StripeMode } from "@/lib/stripe";
import { activerAdhesion, fmtEcheance, PLAN_LABEL } from "@/lib/adhesion";
import { sendMembershipConfirmed } from "@/lib/mail";

/* Confirmation d'un paiement (serveur uniquement) : la transaction est toujours relue auprès
   du prestataire (KKiaPay ou Stripe) avant d'activer l'adhésion. Appelé par le navigateur après
   le widget KKiaPay, par la page de retour Stripe et par les webhooks ; le premier qui passe
   active, l'autre ne fait rien. */

export type Confirmation = "active" | "attente" | "refuse" | "inconnu";

/** Vérifie `transactionId` pour l'adhésion `membershipId` : statut SUCCESS, montant exact, identifiant d'adhésion dans stateData. */
export async function confirmerPaiement(membershipId: string, transactionId: string, mode: KkiaMode, userId?: string): Promise<Confirmation> {
  const m = await db.membership.findFirst({ where: { id: membershipId, ...(userId && { userId }) }, select: { id: true, status: true, paymentRef: true, amount: true, live: true, provider: true } });
  if (!m) return "inconnu";
  if (m.status === "ACTIVE") return "active";
  if (m.status !== "PENDING" || m.provider !== "KKIAPAY") return "refuse";
  if (m.live !== (mode === "live")) return "refuse";
  /* Une transaction ne paie qu'une adhésion. */
  const deja = await db.membership.findUnique({ where: { paymentRef: transactionId }, select: { id: true } });
  if (deja && deja.id !== m.id) return "refuse";
  try {
    const tx = await verifyTransaction(mode, transactionId);
    if (tx.status === "SUCCESS") {
      if (Math.round(tx.amount) !== m.amount) {
        console.error("[adhesion] montant KKiaPay différent", { membershipId, attendu: m.amount, recu: tx.amount });
        return "refuse";
      }
      if (tx.stateData && tx.stateData !== m.id) {
        console.error("[adhesion] transaction d'une autre adhésion", { membershipId, stateData: tx.stateData });
        return "refuse";
      }
      await finaliserPaiement(m.id, transactionId, modeLabel(tx));
      return "active";
    }
    if (tx.status === "FAILED") return "refuse";
    return "attente";
  } catch (e) {
    console.error("[adhesion] vérification KKiaPay impossible", e);
    return "attente";
  }
}

/** Stripe : relit la session Checkout (payée, bon montant, bonne devise, bonne adhésion) puis active. */
export async function confirmerStripe(membershipId: string, mode: StripeMode, userId?: string): Promise<Confirmation> {
  const m = await db.membership.findFirst({ where: { id: membershipId, ...(userId && { userId }) }, select: { id: true, status: true, paymentRef: true, amount: true, currency: true, live: true, provider: true } });
  if (!m) return "inconnu";
  if (m.status === "ACTIVE") return "active";
  if (m.status !== "PENDING" || m.provider !== "STRIPE" || !m.paymentRef) return "refuse";
  if (m.live !== (mode === "live")) return "refuse";
  try {
    const s = await getCheckoutSession(mode, m.paymentRef);
    if (s.payment_status === "paid") {
      if (s.amount_total !== m.amount || (s.currency ?? "").toUpperCase() !== m.currency || (s.metadata?.membershipId && s.metadata.membershipId !== m.id)) {
        console.error("[adhesion] session Stripe incohérente", { membershipId, attendu: [m.amount, m.currency], recu: [s.amount_total, s.currency, s.metadata] });
        return "refuse";
      }
      await finaliserPaiement(m.id, m.paymentRef, `stripe:${(s.payment_method_types ?? ["card"]).join("+")}`);
      return "active";
    }
    if (s.status === "expired") {
      await db.membership.update({ where: { id: m.id }, data: { status: "CANCELLED", note: "Session Stripe expirée" } });
      return "refuse";
    }
    return "attente";
  } catch (e) {
    console.error("[adhesion] relecture Stripe impossible", e);
    return "attente";
  }
}

/** Active l'adhésion après paiement vérifié, journalise et envoie le reçu. */
export async function finaliserPaiement(membershipId: string, transactionId: string, mode: string | null) {
  const avant = await db.membership.findUnique({ where: { id: membershipId }, select: { status: true } });
  const m = await activerAdhesion(membershipId, { paymentRef: transactionId, paymentMode: mode });
  if (!m || avant?.status === "ACTIVE") return m;
  const full = await db.membership.findUnique({ where: { id: membershipId }, select: { plan: true, displayAmount: true, endsAt: true, paymentRef: true, user: { select: { email: true, profile: { select: { displayName: true } } } } } });
  await db.auditLog.create({ data: { userId: m.userId, action: "membership.paid", entity: "Membership", entityId: membershipId, meta: { plan: full?.plan, amount: full?.displayAmount, paymentRef: full?.paymentRef } } });
  if (full) {
    await sendMembershipConfirmed(full.user.email, {
      prenom: (full.user.profile?.displayName ?? "").split(" ")[0] || "cher membre",
      plan: PLAN_LABEL[full.plan],
      montant: full.displayAmount ?? "",
      echeance: fmtEcheance(full.endsAt),
      manuelle: false,
      href: `${SITE_URL}/compte/adhesion`,
    }).catch((e) => console.error("[adhesion] reçu non envoyé", e));
  }
  revalidatePath("/compte/adhesion");
  revalidatePath("/communaute", "layout");
  return m;
}

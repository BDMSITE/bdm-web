import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site-url";
import { getTransaction } from "@/lib/fedapay";
import { activerAdhesion, fmtEcheance, PLAN_LABEL } from "@/lib/adhesion";
import { sendMembershipConfirmed } from "@/lib/mail";

/* Confirmation d'un paiement FedaPay (serveur uniquement, jamais exposé comme action) :
   la transaction est toujours relue à la source avant d'activer l'adhésion. Appelé par la
   page de retour et par le webhook ; le premier qui passe active, l'autre ne fait rien. */

/** Au retour de FedaPay : relit la transaction et active si elle est approuvée (le webhook fait la même chose, le premier gagne). */
export async function confirmerRetour(membershipId: string, userId: string): Promise<"active" | "attente" | "refuse" | "inconnu"> {
  const m = await db.membership.findFirst({ where: { id: membershipId, userId }, select: { id: true, status: true, paymentRef: true, amount: true } });
  if (!m) return "inconnu";
  if (m.status === "ACTIVE") return "active";
  if (m.status !== "PENDING" || !m.paymentRef) return "refuse";
  try {
    const tx = await getTransaction(m.paymentRef);
    if (tx.status === "approved" || tx.status === "transferred") {
      if (tx.amount !== m.amount) {
        console.error("[adhesion] montant FedaPay différent", { membershipId, attendu: m.amount, recu: tx.amount });
        return "attente";
      }
      await finaliserPaiement(m.id, tx.mode);
      return "active";
    }
    if (tx.status === "declined" || tx.status === "canceled") {
      await db.membership.update({ where: { id: m.id }, data: { status: "CANCELLED", note: `Paiement ${tx.status}` } });
      return "refuse";
    }
    return "attente";
  } catch (e) {
    console.error("[adhesion] relecture FedaPay impossible", e);
    return "attente";
  }
}

/** Active l'adhésion après paiement confirmé, journalise et envoie le reçu. Appelée par le retour et par le webhook. */
export async function finaliserPaiement(membershipId: string, mode: string | null | undefined) {
  const avant = await db.membership.findUnique({ where: { id: membershipId }, select: { status: true } });
  const m = await activerAdhesion(membershipId, { paymentMode: mode ?? null });
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


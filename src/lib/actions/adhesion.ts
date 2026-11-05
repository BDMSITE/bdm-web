"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site-url";
import { createTransaction, fedapayConfig } from "@/lib/fedapay";
import { adhesionProposee, deviseDuPays, tarifs, PLAN_LABEL } from "@/lib/adhesion";

/* Action de l'espace membre : démarrer un paiement FedaPay (création de la transaction,
   puis page de paiement). La confirmation se fait côté serveur dans lib/adhesion-paiement.ts. */

export type AdhesionState = { error?: string };

const startSchema = z.object({ plan: z.enum(["ANNUEL", "ETUDIANT"]), attestation: z.string().optional() });

export async function startMembershipAction(_prev: AdhesionState, formData: FormData): Promise<AdhesionState> {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte/adhesion");
  if (!(await adhesionProposee())) return { error: "L'adhésion n'est pas encore ouverte." };
  const feda = await fedapayConfig();
  if (!feda.ready) return { error: "Le paiement en ligne n'est pas encore disponible : écrivez au HCBE pour adhérer." };

  const parsed = startSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Choisissez une formule." };
  const { plan } = parsed.data;
  if (plan === "ETUDIANT" && parsed.data.attestation !== "on") return { error: "Le tarif réduit demande de cocher la déclaration sur l'honneur." };

  const userId = session.user.id;
  const profile = await db.profile.findUnique({ where: { userId }, select: { displayName: true, country: true, user: { select: { email: true } } } });
  if (!profile) return { error: "Profil introuvable." };

  const tarif = (await tarifs(deviseDuPays(profile.country))).find((t) => t.plan === plan)!;
  if (tarif.xof <= 0) return { error: "Ce tarif n'est pas disponible." };

  /* Une seule tentative en attente à la fois : on réutilise la précédente si elle est récente. */
  const enAttente = await db.membership.findFirst({ where: { userId, status: "PENDING", plan, live: feda.live, paymentUrl: { not: null }, createdAt: { gt: new Date(Date.now() - 20 * 60e3) } }, select: { id: true } });
  if (enAttente) redirect(`/compte/adhesion/payer?m=${enAttente.id}`);

  const m = await db.membership.create({
    data: { userId, plan, amount: tarif.xof, currency: "XOF", displayAmount: tarif.affiche, live: feda.live },
    select: { id: true },
  });
  const [prenom, ...reste] = profile.displayName.trim().split(/\s+/);
  try {
    const tx = await createTransaction(feda.mode, {
      description: `Adhésion HCBE — ${PLAN_LABEL[plan]} — Béninois du Monde`,
      amountXof: tarif.xof,
      callbackUrl: `${SITE_URL}/compte/adhesion/retour?m=${m.id}`,
      customer: { firstname: prenom || "Membre", lastname: reste.join(" ") || "BDM", email: profile.user.email },
      metadata: { membershipId: m.id, userId, plan },
    });
    await db.membership.update({ where: { id: m.id }, data: { paymentRef: String(tx.id), paymentUrl: tx.url } });
  } catch (e) {
    console.error("[adhesion] création de transaction FedaPay impossible", e);
    await db.membership.update({ where: { id: m.id }, data: { status: "CANCELLED", note: "Création de la transaction FedaPay impossible" } });
    return { error: "Le service de paiement ne répond pas pour l'instant. Réessayez dans quelques minutes." };
  }
  redirect(`/compte/adhesion/payer?m=${m.id}`);
}

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { kkiapayConfig } from "@/lib/kkiapay";
import { createCheckoutSession } from "@/lib/stripe";
import { paiementConfig, prestatairePour } from "@/lib/paiement";
import { SITE_URL } from "@/lib/site-url";
import { adhesionProposee, deviseDuPays, tarifs, PLAN_LABEL } from "@/lib/adhesion";
import { confirmerPaiement, type Confirmation } from "@/lib/adhesion-paiement";

/* Actions de l'espace membre : préparer une adhésion à payer (ligne PENDING, montant figé),
   l'aiguiller vers KKiaPay (zone franc, widget sur le site) ou Stripe (reste du monde, page
   Checkout), puis, après le widget KKiaPay, faire vérifier la transaction par le serveur. */

export type AdhesionState = { error?: string };

const startSchema = z.object({ plan: z.enum(["ANNUEL", "ETUDIANT"]), attestation: z.string().optional() });

export async function startMembershipAction(_prev: AdhesionState, formData: FormData): Promise<AdhesionState> {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte/adhesion");
  if (!(await adhesionProposee())) return { error: "L'adhésion n'est pas encore ouverte." };
  const config = await paiementConfig();
  if (!config.enLigne) return { error: "Le paiement en ligne n'est pas encore disponible : écrivez au HCBE pour adhérer." };

  const parsed = startSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Choisissez une formule." };
  const { plan } = parsed.data;
  if (plan === "ETUDIANT" && parsed.data.attestation !== "on") return { error: "Le tarif réduit demande de cocher la déclaration sur l'honneur." };

  const userId = session.user.id;
  const profile = await db.profile.findUnique({ where: { userId }, select: { country: true, user: { select: { email: true } } } });
  if (!profile) return { error: "Profil introuvable." };
  const devise = deviseDuPays(profile.country);
  const tarif = (await tarifs(devise)).find((t) => t.plan === plan)!;
  const prestataire = prestatairePour(devise, config);
  if (!prestataire) return { error: "Aucun moyen de paiement disponible pour votre pays pour l'instant : écrivez au HCBE." };

  /* Stripe débite la devise affichée (centimes) ; KKiaPay débite en FCFA. */
  const stripeDevise = devise === "XOF" ? "eur" : (devise.toLowerCase() as "eur" | "usd" | "cad");
  const amount = prestataire === "STRIPE" ? Math.round((devise === "XOF" ? tarif.eur : tarif.local) * 100) : tarif.xof;
  const currency = prestataire === "STRIPE" ? stripeDevise.toUpperCase() : "XOF";
  if (amount <= 0) return { error: "Ce tarif n'est pas disponible." };
  const live = prestataire === "STRIPE" ? config.stripe.live : config.kkia.live;

  /* Une tentative en attente récente pour la même formule et le même prestataire est réutilisée. */
  const enAttente = await db.membership.findFirst({ where: { userId, status: "PENDING", plan, live, provider: prestataire, amount, currency, createdAt: { gt: new Date(Date.now() - 50 * 60e3) } }, select: { id: true, paymentUrl: true } });
  if (enAttente) redirect(prestataire === "STRIPE" && enAttente.paymentUrl ? enAttente.paymentUrl : `/compte/adhesion/payer?m=${enAttente.id}`);

  const m = await db.membership.create({
    data: { userId, plan, amount, currency, displayAmount: tarif.affiche, live, provider: prestataire },
    select: { id: true },
  });
  if (prestataire === "KKIAPAY") redirect(`/compte/adhesion/payer?m=${m.id}`);

  let url = "";
  try {
    const sess = await createCheckoutSession(config.stripe.mode, {
      amountMinor: amount,
      currency: stripeDevise,
      name: `Adhésion HCBE — ${PLAN_LABEL[plan]}`,
      description: "Béninois du Monde · adhésion annuelle au Haut Conseil des Béninois de l'Extérieur (12 mois, sans renouvellement automatique)",
      email: profile.user.email,
      membershipId: m.id,
      successUrl: `${SITE_URL}/compte/adhesion/retour?m=${m.id}`,
      cancelUrl: `${SITE_URL}/compte/adhesion?etat=refuse`,
    });
    await db.membership.update({ where: { id: m.id }, data: { paymentRef: sess.id, paymentUrl: sess.url } });
    url = sess.url;
  } catch (e) {
    console.error("[adhesion] session Stripe impossible", e);
    await db.membership.update({ where: { id: m.id }, data: { status: "CANCELLED", note: "Création de la session Stripe impossible" } });
    return { error: "Le service de paiement ne répond pas pour l'instant. Réessayez dans quelques minutes." };
  }
  redirect(url);
}

/** Après le widget : le navigateur transmet l'identifiant de transaction, le serveur vérifie auprès de KKiaPay. */
export async function confirmPaymentAction(membershipId: string, transactionId: string): Promise<Confirmation> {
  const session = await auth();
  if (!session?.user) return "inconnu";
  const id = z.string().min(1).max(100).safeParse(transactionId);
  if (!id.success || !membershipId) return "inconnu";
  const kkia = await kkiapayConfig();
  return confirmerPaiement(membershipId, id.data, kkia.mode, session.user.id);
}

import { kkiapayConfig } from "./kkiapay";
import { stripeConfig } from "./stripe";
import type { Devise } from "./adhesion";

/* Aiguillage des paiements d'adhésion (décision 05/11) : deux prestataires, un seul interrupteur
   test / réel (« Paiements : encaisser pour de vrai », Paramètres).
   - KKiaPay : membres de la zone franc → Mobile Money, carte, wallet, débit en FCFA ;
   - Stripe : membres hors zone franc → carte bancaire en €, $ US ou $ CA, au prix affiché.
   Si un prestataire manque, l'autre prend le relais quand c'est possible (Stripe ne fait pas le
   FCFA ; KKiaPay accepte les cartes du monde entier, mais débite en FCFA). */

export type Prestataire = "KKIAPAY" | "STRIPE";

export async function paiementConfig() {
  const [kkia, stripe] = await Promise.all([kkiapayConfig(), stripeConfig()]);
  return { kkia, stripe, live: kkia.live || stripe.live, enLigne: kkia.ready || stripe.ready };
}

/** Prestataire pour une devise d'affichage, ou null si aucun n'est prêt. */
export function prestatairePour(devise: Devise, c: { kkia: { ready: boolean }; stripe: { ready: boolean } }): Prestataire | null {
  if (devise === "XOF") return c.kkia.ready ? "KKIAPAY" : null;
  if (c.stripe.ready) return "STRIPE";
  return c.kkia.ready ? "KKIAPAY" : null;
}

export const PRESTATAIRE_LABEL: Record<Prestataire, string> = { KKIAPAY: "KKiaPay", STRIPE: "Stripe" };

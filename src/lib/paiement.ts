import { kkiapayConfig } from "./kkiapay";
import { stripeConfig } from "./stripe";
import { flag } from "./settings";
import type { Devise } from "./adhesion";

/* Aiguillage des paiements d'adhésion (décision 05/11) : deux prestataires, un seul interrupteur
   test / réel (« Paiements : encaisser pour de vrai », Paramètres).
   - KKiaPay : membres de la zone franc → Mobile Money, carte, wallet, débit en FCFA ;
   - Stripe : membres hors zone franc → carte bancaire en €, $ US ou $ CA, au prix affiché.
   Si un prestataire manque, l'autre prend le relais quand c'est possible (Stripe ne fait pas le
   FCFA ; KKiaPay accepte les cartes du monde entier, mais débite en FCFA). */

export type Prestataire = "KKIAPAY" | "STRIPE";

/* Garde-fou : quand « encaisser pour de vrai » est coché, un prestataire dont seules les clés de test
   sont posées resterait en mode simulé. Un membre passerait alors au paiement sans qu'un centime soit
   encaissé, et son adhésion serait activée avec la mention « Test ». On le traite donc comme
   indisponible : l'autre prestataire prend le relais, ou l'activation reste manuelle (Admin → Adhésions). */
function sansModeSimule<T extends { ready: boolean; live: boolean }>(c: T, liveVoulu: boolean): T & { enTest: boolean } {
  const enTest = liveVoulu && c.ready && !c.live;
  return { ...c, ready: c.ready && !enTest, enTest };
}

export async function paiementConfig() {
  const [liveVoulu, kkiaBrut, stripeBrut] = await Promise.all([flag("paiement.live"), kkiapayConfig(), stripeConfig()]);
  const kkia = sansModeSimule(kkiaBrut, liveVoulu);
  const stripe = sansModeSimule(stripeBrut, liveVoulu);
  return { kkia, stripe, liveVoulu, live: kkia.live || stripe.live, enLigne: kkia.ready || stripe.ready };
}

/** Prestataire pour une devise d'affichage, ou null si aucun n'est prêt. */
export function prestatairePour(devise: Devise, c: { kkia: { ready: boolean }; stripe: { ready: boolean } }): Prestataire | null {
  if (devise === "XOF") return c.kkia.ready ? "KKIAPAY" : null;
  if (c.stripe.ready) return "STRIPE";
  return c.kkia.ready ? "KKIAPAY" : null;
}

export const PRESTATAIRE_LABEL: Record<Prestataire, string> = { KKIAPAY: "KKiaPay", STRIPE: "Stripe" };

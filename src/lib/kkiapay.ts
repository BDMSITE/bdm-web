import { timingSafeEqual } from "node:crypto";
import { flag } from "./settings";

/* KKiaPay (paiement Mobile Money, carte et wallets, Afrique de l'Ouest) : le compte du HCBE
   est chez KKiaPay. Le widget (k.js) crée la transaction côté navigateur avec la clé publique ;
   le serveur la vérifie ensuite auprès de l'API avec les trois clés (publique, privée, secrète)
   avant d'activer quoi que ce soit. Deux jeux de clés dans l'environnement : KKIAPAY_SANDBOX_*
   (test, aucun argent réel) et KKIAPAY_LIVE_* ; l'interrupteur « KKiaPay : encaisser pour de
   vrai » (Paramètres) choisit le jeu utilisé. KKiaPay n'encaisse qu'en XOF (franc CFA).
   Doc : https://docs.kkiapay.me (SDK Javascript, Admin SDK, Webhook). */

export type KkiaMode = "sandbox" | "live";

const API: Record<KkiaMode, string> = { sandbox: "https://api-sandbox.kkiapay.me", live: "https://api.kkiapay.me" };
export const KKIAPAY_SCRIPT = "https://cdn.kkiapay.me/k.js";

function keys(mode: KkiaMode) {
  const p = mode === "live" ? "KKIAPAY_LIVE_" : "KKIAPAY_SANDBOX_";
  return {
    publicKey: process.env[`${p}PUBLIC_KEY`] ?? "",
    privateKey: process.env[`${p}PRIVATE_KEY`] ?? "",
    secretKey: process.env[`${p}SECRET_KEY`] ?? "",
    webhookSecret: process.env[`${p}WEBHOOK_SECRET`] ?? "",
  };
}

/** Jeu de clés complet pour un mode (publique + privée + secrète : le widget et la vérification serveur). */
export function keysPresent(mode: KkiaMode) {
  const k = keys(mode);
  return Boolean(k.publicKey && k.privateKey && k.secretKey);
}

/** Mode choisi dans Paramètres : live seulement si l'interrupteur est coché ET les clés live existent. */
export async function kkiapayMode(): Promise<KkiaMode> {
  return (await flag("paiement.live")) && keysPresent("live") ? "live" : "sandbox";
}

/** Configuration active : mode, clé publique (widget), état « prêt », secret de webhook posé. */
export async function kkiapayConfig() {
  const mode = await kkiapayMode();
  const k = keys(mode);
  return { mode, live: mode === "live", publicKey: k.publicKey, ready: keysPresent(mode), webhookReady: Boolean(k.webhookSecret) };
}

export type KkiaTransaction = {
  transactionId?: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | string;
  amount: number;
  fees?: number;
  source?: string; // MOBILE_MONEY | CARD | WALLET
  source_common_name?: string; // mtn-benin, moov-benin…
  performedAt?: string;
  performed_at?: string;
  stateData?: string | null; // notre `data` passée au widget (identifiant d'adhésion)
  state?: string | null;
  reason?: string;
  failureCode?: string;
  failureMessage?: string;
  client?: { fullname?: string; phone?: string; email?: string };
};

class KkiaPayError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** Relit une transaction auprès de KKiaPay (source de vérité : jamais se fier au navigateur ni au seul webhook). */
export async function verifyTransaction(mode: KkiaMode, transactionId: string): Promise<KkiaTransaction> {
  const k = keys(mode);
  if (!k.privateKey || !k.secretKey || !k.publicKey) throw new KkiaPayError(`KKiaPay ${mode} n'est pas configuré (clés absentes).`, 0);
  const res = await fetch(`${API[mode]}/api/v1/transactions/status`, {
    method: "POST",
    headers: { "x-api-key": k.publicKey, "x-private-key": k.privateKey, "x-secret-key": k.secretKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ transactionId }),
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const msg = (json as { reason?: string; message?: string } | null)?.reason ?? (json as { message?: string } | null)?.message ?? text.slice(0, 200);
    throw new KkiaPayError(`KKiaPay ${res.status} : ${msg || "réponse vide"}`, res.status);
  }
  return json as KkiaTransaction;
}

/* ---------- Webhooks ---------- */

export type KkiaEvent = {
  event?: "transaction.success" | "transaction.failed" | string;
  transactionId?: string;
  isPaymentSucces?: boolean;
  amount?: number;
  fees?: number;
  method?: string; // MOBILE_MONEY | CARD | WALLET
  stateData?: string | null;
  performedAt?: string;
  failureCode?: string;
  failureMessage?: string;
};

/** Quel jeu de clés correspond au secret reçu dans X-KKIAPAY-SECRET (hash choisi dans le tableau de bord), ou null. */
export function webhookMode(header: string | null): KkiaMode | null {
  if (!header) return null;
  const h = Buffer.from(header);
  for (const mode of ["live", "sandbox"] as const) {
    const s = keys(mode).webhookSecret;
    if (s && s.length === header.length && timingSafeEqual(Buffer.from(s), h)) return mode;
  }
  return null;
}

export function parseEvent(rawBody: string): KkiaEvent | null {
  try {
    const e = JSON.parse(rawBody) as KkiaEvent;
    return e && typeof e === "object" ? e : null;
  } catch {
    return null;
  }
}

/** Libellé lisible du moyen de paiement rapporté par KKiaPay. */
export function modeLabel(tx: { source?: string; source_common_name?: string; method?: string }) {
  return tx.source_common_name ?? tx.source ?? tx.method ?? null;
}

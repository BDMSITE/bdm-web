import { createHmac, timingSafeEqual } from "node:crypto";
import { flag } from "./settings";

/* FedaPay (paiement Mobile Money + carte, Afrique de l'Ouest). Appels REST directs,
   sans SDK : créer une transaction, obtenir son lien / jeton de paiement, la relire,
   vérifier la signature des webhooks. Deux jeux de clés dans l'environnement :
   FEDAPAY_SANDBOX_* (test, aucun argent réel) et FEDAPAY_LIVE_* ; l'interrupteur
   « FedaPay : encaisser pour de vrai » (Paramètres) choisit le jeu utilisé. FedaPay
   n'encaisse qu'en XOF : les montants envoyés ici sont des entiers en XOF.
   Doc : https://docs.fedapay.com (Transactions, Webhooks, Checkout.js). */

export type FedaMode = "sandbox" | "live";

const API: Record<FedaMode, string> = { sandbox: "https://sandbox-api.fedapay.com/v1", live: "https://api.fedapay.com/v1" };

function keys(mode: FedaMode) {
  const p = mode === "live" ? "FEDAPAY_LIVE_" : "FEDAPAY_SANDBOX_";
  return { publicKey: process.env[`${p}PUBLIC_KEY`] ?? "", secretKey: process.env[`${p}SECRET_KEY`] ?? "", webhookSecret: process.env[`${p}WEBHOOK_SECRET`] ?? "" };
}

/** Jeu de clés disponible pour un mode (clé publique + clé secrète). */
export function keysPresent(mode: FedaMode) {
  const k = keys(mode);
  return Boolean(k.publicKey && k.secretKey);
}

/** Mode choisi dans Paramètres : live seulement si l'interrupteur est coché ET les clés live existent. */
export async function fedapayMode(): Promise<FedaMode> {
  return (await flag("fedapay.live")) && keysPresent("live") ? "live" : "sandbox";
}

/** Configuration active : mode, clé publique (widget), état « prêt » ; sans clé secrète, pas de paiement en ligne. */
export async function fedapayConfig() {
  const mode = await fedapayMode();
  const k = keys(mode);
  return { mode, live: mode === "live", publicKey: k.publicKey, ready: Boolean(k.publicKey && k.secretKey), webhookReady: Boolean(k.webhookSecret) };
}

export type FedaTransaction = {
  id: number;
  reference: string;
  status: "pending" | "approved" | "declined" | "canceled" | "refunded" | "transferred" | string;
  amount: number;
  description: string;
  callback_url: string | null;
  mode: string | null;
  currency_id?: number;
  custom_metadata?: Record<string, string> | null;
  approved_at?: string | null;
};

class FedaPayError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function call<T>(mode: FedaMode, path: string, init: RequestInit = {}): Promise<T> {
  const { secretKey } = keys(mode);
  if (!secretKey) throw new FedaPayError(`FedaPay ${mode} n'est pas configuré (clé secrète absente).`, 0);
  const res = await fetch(`${API[mode]}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json", Accept: "application/json", ...(init.headers ?? {}) },
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
    const msg = (json as { message?: string } | null)?.message ?? text.slice(0, 200);
    throw new FedaPayError(`FedaPay ${res.status} : ${msg || "réponse vide"}`, res.status);
  }
  return json as T;
}

/** Crée la transaction puis son jeton de paiement : renvoie l'identifiant, le jeton et l'URL de la page FedaPay. */
export async function createTransaction(mode: FedaMode, input: {
  description: string;
  amountXof: number;
  callbackUrl: string;
  customer: { firstname: string; lastname: string; email: string };
  metadata?: Record<string, string>;
}) {
  const created = await call<{ "v1/transaction": FedaTransaction }>(mode, "/transactions", {
    method: "POST",
    body: JSON.stringify({
      description: input.description.slice(0, 200),
      amount: Math.max(1, Math.round(input.amountXof)),
      currency: { iso: "XOF" },
      callback_url: input.callbackUrl,
      customer: input.customer,
      custom_metadata: input.metadata ?? {},
    }),
  });
  const tx = created["v1/transaction"];
  const token = await call<{ token: string; url: string }>(mode, `/transactions/${tx.id}/token`, { method: "POST" });
  return { id: tx.id, reference: tx.reference, token: token.token, url: token.url };
}

/** Relit une transaction (source de vérité : jamais se fier au `status` de l'URL de retour). */
export async function getTransaction(mode: FedaMode, id: string | number) {
  const r = await call<{ "v1/transaction": FedaTransaction }>(mode, `/transactions/${encodeURIComponent(String(id))}`);
  return r["v1/transaction"];
}

/* ---------- Webhooks ---------- */

export type FedaEvent = { name: string; entity?: FedaTransaction; object?: FedaTransaction };

/** Vérifie l'en-tête X-FEDAPAY-SIGNATURE (« t=<unix>,s=<hmac-sha256 hex> » sur `${t}.${corps brut}`), 5 min de tolérance. */
export function verifyWebhookSignature(rawBody: string, header: string | null, secret: string, toleranceSec = 300): boolean {
  if (!header || !secret) return false;
  let timestamp = -1;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.trim().split("=");
    if (k === "t") timestamp = Number.parseInt(v ?? "", 10);
    if (k === "s" && v) signatures.push(v);
  }
  if (!Number.isFinite(timestamp) || timestamp < 0 || signatures.length === 0) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
  const ok = signatures.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
  if (!ok) return false;
  return toleranceSec <= 0 || Math.abs(Math.floor(Date.now() / 1000) - timestamp) <= toleranceSec;
}

/** Quel jeu de clés a signé ce webhook (sandbox et live ont chacun leur secret), ou null. */
export function webhookMode(rawBody: string, header: string | null): FedaMode | null {
  for (const mode of ["live", "sandbox"] as const) {
    const { webhookSecret } = keys(mode);
    if (webhookSecret && verifyWebhookSignature(rawBody, header, webhookSecret)) return mode;
  }
  return null;
}

export function parseEvent(rawBody: string): FedaEvent | null {
  try {
    const e = JSON.parse(rawBody) as FedaEvent;
    return e && typeof e.name === "string" ? e : null;
  } catch {
    return null;
  }
}

import { createHmac, timingSafeEqual } from "node:crypto";

/* FedaPay (paiement Mobile Money + carte, Afrique de l'Ouest). Appels REST directs,
   sans SDK : créer une transaction, obtenir son lien / jeton de paiement, la relire,
   vérifier la signature des webhooks. Sandbox ou live selon le préfixe de la clé
   secrète (sk_sandbox_… / sk_live_…). FedaPay n'encaisse qu'en XOF (franc CFA) :
   les montants envoyés ici sont toujours des entiers en XOF.
   Doc : https://docs.fedapay.com (Transactions, Webhooks, Checkout.js). */

const SECRET = process.env.FEDAPAY_SECRET_KEY ?? "";
export const FEDAPAY_PUBLIC_KEY = process.env.FEDAPAY_PUBLIC_KEY ?? "";
export const FEDAPAY_LIVE = SECRET.startsWith("sk_live_");
const API = FEDAPAY_LIVE ? "https://api.fedapay.com/v1" : "https://sandbox-api.fedapay.com/v1";

/** Clés présentes : le paiement en ligne peut être proposé. */
export function fedapayConfigured() {
  return Boolean(SECRET && FEDAPAY_PUBLIC_KEY);
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

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!SECRET) throw new FedaPayError("FedaPay n'est pas configuré (FEDAPAY_SECRET_KEY).", 0);
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json", Accept: "application/json", ...(init.headers ?? {}) },
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
export async function createTransaction(input: {
  description: string;
  amountXof: number;
  callbackUrl: string;
  customer: { firstname: string; lastname: string; email: string };
  metadata?: Record<string, string>;
}) {
  const created = await call<{ "v1/transaction": FedaTransaction }>("/transactions", {
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
  const token = await call<{ token: string; url: string }>(`/transactions/${tx.id}/token`, { method: "POST" });
  return { id: tx.id, reference: tx.reference, token: token.token, url: token.url };
}

/** Relit une transaction (source de vérité : jamais se fier au `status` de l'URL de retour). */
export async function getTransaction(id: string | number) {
  const r = await call<{ "v1/transaction": FedaTransaction }>(`/transactions/${encodeURIComponent(String(id))}`);
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

export function parseEvent(rawBody: string): FedaEvent | null {
  try {
    const e = JSON.parse(rawBody) as FedaEvent;
    return e && typeof e.name === "string" ? e : null;
  } catch {
    return null;
  }
}

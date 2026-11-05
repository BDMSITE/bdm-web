import { createHmac, timingSafeEqual } from "node:crypto";
import { flag } from "./settings";

/* Stripe (cartes bancaires en €, $ US, $ CA) pour les membres hors zone franc : Checkout
   hébergé par Stripe (page de paiement), puis vérification de la session côté serveur et
   webhook signé. Appels REST directs, sans SDK. Deux jeux de clés : STRIPE_TEST_* et
   STRIPE_LIVE_* ; l'interrupteur « Paiements : encaisser pour de vrai » (Paramètres) choisit.
   Doc : https://docs.stripe.com/api/checkout/sessions, https://docs.stripe.com/webhooks. */

export type StripeMode = "test" | "live";
const API = "https://api.stripe.com/v1";

function keys(mode: StripeMode) {
  const p = mode === "live" ? "STRIPE_LIVE_" : "STRIPE_TEST_";
  return { secretKey: process.env[`${p}SECRET_KEY`] ?? "", webhookSecret: process.env[`${p}WEBHOOK_SECRET`] ?? "" };
}

export function stripeKeysPresent(mode: StripeMode) {
  return Boolean(keys(mode).secretKey);
}

export async function stripeMode(): Promise<StripeMode> {
  return (await flag("paiement.live")) && stripeKeysPresent("live") ? "live" : "test";
}

export async function stripeConfig() {
  const mode = await stripeMode();
  const k = keys(mode);
  return { mode, live: mode === "live", ready: Boolean(k.secretKey), webhookReady: Boolean(k.webhookSecret) };
}

export type StripeSession = {
  id: string;
  status: "open" | "complete" | "expired" | string;
  payment_status: "paid" | "unpaid" | "no_payment_required" | string;
  amount_total: number | null;
  currency: string | null;
  url: string | null;
  payment_intent: string | null;
  client_reference_id: string | null;
  metadata: Record<string, string> | null;
  payment_method_types?: string[];
};

class StripeError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function call<T>(mode: StripeMode, path: string, init: RequestInit = {}): Promise<T> {
  const { secretKey } = keys(mode);
  if (!secretKey) throw new StripeError(`Stripe ${mode} n'est pas configuré (clé secrète absente).`, 0);
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", ...(init.headers ?? {}) },
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
    const msg = (json as { error?: { message?: string } } | null)?.error?.message ?? text.slice(0, 200);
    throw new StripeError(`Stripe ${res.status} : ${msg || "réponse vide"}`, res.status);
  }
  return json as T;
}

/** Crée une session Checkout (paiement unique) et renvoie son identifiant et l'URL de la page Stripe. */
export async function createCheckoutSession(mode: StripeMode, input: {
  /** Montant en centimes de `currency` (eur, usd, cad). */
  amountMinor: number;
  currency: "eur" | "usd" | "cad";
  name: string;
  description: string;
  email: string;
  membershipId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const body = new URLSearchParams({
    mode: "payment",
    locale: "fr",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": input.currency,
    "line_items[0][price_data][unit_amount]": String(Math.max(1, Math.round(input.amountMinor))),
    "line_items[0][price_data][product_data][name]": input.name.slice(0, 120),
    "line_items[0][price_data][product_data][description]": input.description.slice(0, 200),
    customer_email: input.email,
    client_reference_id: input.membershipId,
    "metadata[membershipId]": input.membershipId,
    "payment_intent_data[metadata][membershipId]": input.membershipId,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    expires_at: String(Math.floor(Date.now() / 1000) + 60 * 60),
  });
  const s = await call<StripeSession>(mode, "/checkout/sessions", { method: "POST", body });
  return { id: s.id, url: s.url ?? "" };
}

/** Relit une session Checkout (source de vérité). */
export function getCheckoutSession(mode: StripeMode, id: string) {
  return call<StripeSession>(mode, `/checkout/sessions/${encodeURIComponent(id)}`);
}

/* ---------- Webhooks ---------- */

export type StripeEvent = { id: string; type: string; livemode: boolean; data: { object: StripeSession & Record<string, unknown> } };

/** Vérifie l'en-tête Stripe-Signature (« t=<unix>,v1=<hmac-sha256 hex> » sur `${t}.${corps brut}`), 5 min de tolérance. */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string, toleranceSec = 300): boolean {
  if (!header || !secret) return false;
  let timestamp = -1;
  const sigs: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.trim().split("=");
    if (k === "t") timestamp = Number.parseInt(v ?? "", 10);
    if (k === "v1" && v) sigs.push(v);
  }
  if (!Number.isFinite(timestamp) || timestamp < 0 || sigs.length === 0) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
  const ok = sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
  if (!ok) return false;
  return toleranceSec <= 0 || Math.abs(Math.floor(Date.now() / 1000) - timestamp) <= toleranceSec;
}

/** Quel jeu de clés a signé ce webhook (test et live ont chacun leur secret `whsec_…`), ou null. */
export function stripeWebhookMode(rawBody: string, header: string | null): StripeMode | null {
  for (const mode of ["live", "test"] as const) {
    const s = keys(mode).webhookSecret;
    if (s && verifyStripeSignature(rawBody, header, s)) return mode;
  }
  return null;
}

export function parseStripeEvent(rawBody: string): StripeEvent | null {
  try {
    const e = JSON.parse(rawBody) as StripeEvent;
    return e && typeof e.type === "string" && e.data?.object ? e : null;
  } catch {
    return null;
  }
}

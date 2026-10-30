import { SITE_URL } from "./site-url";

/* Images générées (partage sur WhatsApp, Facebook, LinkedIn ; icônes d'écran d'accueil).
   Police : Public Sans 800, la même que les titres du site, chargée depuis Google Fonts
   et mise en cache par Next. Aucun fichier binaire dans le dépôt. */

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const GREEN = "#008751";
export const YELLOW = "#fcd116";
export const RED = "#e8112d";
export const INK = "#1b1f1d";

let fontPromise: Promise<ArrayBuffer> | undefined;

async function loadFont(): Promise<ArrayBuffer> {
  const css = await fetch("https://fonts.googleapis.com/css2?family=Public+Sans:wght@800", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; satori)" },
    cache: "force-cache",
  }).then((r) => r.text());
  const url = css.match(/src: url\((https:\/\/[^)]+\.ttf)\)/)?.[1] ?? css.match(/url\((https:\/\/[^)]+)\)/)?.[1];
  if (!url) throw new Error("Police Public Sans introuvable");
  const buf = await fetch(url, { cache: "force-cache" }).then((r) => r.arrayBuffer());
  if (!buf) throw new Error("Police Public Sans vide");
  return buf;
}

export function publicSansBold(): Promise<ArrayBuffer> {
  fontPromise ??= loadFont();
  return fontPromise;
}

/** URL de l'image de partage pour un titre donné (coupé pour rester lisible). */
export function ogImageUrl(opts: { title: string; kind?: string; place?: string }) {
  const p = new URLSearchParams({ t: opts.title.slice(0, 120) });
  if (opts.kind) p.set("k", opts.kind);
  if (opts.place) p.set("s", opts.place.slice(0, 80));
  return `${SITE_URL}/api/og?${p.toString()}`;
}

export const DEFAULT_OG = { url: `${SITE_URL}/api/og`, width: OG_SIZE.width, height: OG_SIZE.height, alt: "Béninois du Monde" };

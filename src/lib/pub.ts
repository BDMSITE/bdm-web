import type { Banner, BannerSlot } from "@prisma/client";
import { after } from "next/server";
import { db } from "./db";

/* Régie publicitaire : catalogue des emplacements, choix d'une campagne pour
   un emplacement (rotation pondérée, ciblage rubrique/pays, repli sur les
   campagnes maison), comptage des affichages et des clics. */

export { SLOTS, SLOT_BY_CODE, type SlotSpec } from "./pub-slots";

export type PubBanner = Pick<Banner, "id" | "kind" | "image" | "imageMobile" | "photo" | "alt" | "headline" | "tagline" | "bg" | "fg" | "advertiser" | "house" | "slot">;

const SELECT = { id: true, kind: true, image: true, imageMobile: true, photo: true, alt: true, headline: true, tagline: true, bg: true, fg: true, advertiser: true, house: true, slot: true, weight: true, sections: true, countries: true } as const;

/** Campagnes diffusables maintenant pour un emplacement : les vendues s'il y en a, sinon les
    campagnes maison. Ordre mélangé, pondéré par le poids (les plus lourdes sortent plus tôt). */
export async function listBanners(slot: BannerSlot, ctx: { section?: string; country?: string } = {}): Promise<PubBanner[]> {
  const pool = await eligible(slot, ctx);
  return pool
    .map((b) => ({ b, k: Math.random() ** (1 / Math.max(1, b.weight)) }))
    .sort((x, y) => y.k - x.k)
    .map((x) => x.b);
}

async function eligible(slot: BannerSlot, ctx: { section?: string; country?: string }) {
  const now = new Date();
  const rows = await db.banner.findMany({
    where: { slot, status: "PUBLISHED", startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    select: SELECT,
  });
  const cible = rows.filter(
    (b) => (b.sections.length === 0 || (ctx.section && b.sections.includes(ctx.section))) && (b.countries.length === 0 || (ctx.country && b.countries.includes(ctx.country))),
  );
  const vendues = cible.filter((b) => !b.house);
  return vendues.length ? vendues : cible.filter((b) => b.house);
}

/** Une seule campagne (tirage pondéré) — pour les usages sans carrousel. */
export async function pickBanner(slot: BannerSlot, ctx: { section?: string; country?: string } = {}): Promise<PubBanner | null> {
  const pool = await eligible(slot, ctx);
  if (!pool.length) return null;
  const total = pool.reduce((n, b) => n + Math.max(1, b.weight), 0);
  let r = Math.random() * total;
  for (const b of pool) {
    r -= Math.max(1, b.weight);
    if (r <= 0) return b;
  }
  return pool[pool.length - 1];
}

function today() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function count(bannerId: string, field: "impressions" | "clicks") {
  await db.$transaction([
    db.banner.update({ where: { id: bannerId }, data: { [field]: { increment: 1 } } }),
    db.bannerStat.upsert({
      where: { bannerId_day: { bannerId, day: today() } },
      update: { [field]: { increment: 1 } },
      create: { bannerId, day: today(), [field]: 1 },
    }),
  ]).catch(() => {});
}

/** Affichage compté après l'envoi de la page, sans ralentir le rendu. */
export function recordImpression(bannerId: string) {
  after(() => count(bannerId, "impressions"));
}

export function recordClick(bannerId: string) {
  return count(bannerId, "clicks");
}

export { clickHref } from "./pub-slots";

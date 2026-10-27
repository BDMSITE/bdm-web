import type { BannerSlot } from "@prisma/client";

/* Catalogue des emplacements publicitaires (sans dépendance serveur : importable
   par les composants client et les pages publiques). */

export type SlotSpec = {
  code: BannerSlot;
  label: string;
  desktop: { w: number; h: number };
  mobile: { w: number; h: number };
  where: string;
};

export const SLOTS: SlotSpec[] = [
  { code: "TOP", label: "Bandeau haut de rubrique", desktop: { w: 970, h: 90 }, mobile: { w: 320, h: 100 }, where: "Sous l'en-tête des pages de rubrique (emploi, agenda, adresses, magazine…)." },
  { code: "SIDE", label: "Pavé latéral", desktop: { w: 300, h: 250 }, mobile: { w: 300, h: 250 }, where: "Colonne de droite de toutes les rubriques, fiches et annuaires ; en fin de page sur mobile." },
  { code: "MID", label: "Pavé milieu d'accueil", desktop: { w: 728, h: 90 }, mobile: { w: 320, h: 100 }, where: "Page d'accueil, entre le magazine et les bonnes adresses." },
  { code: "BOTTOM", label: "Bannière bas de page", desktop: { w: 970, h: 90 }, mobile: { w: 320, h: 100 }, where: "Au-dessus du pied de page, sur toutes les pages (bureau)." },
];

export const SLOT_BY_CODE = Object.fromEntries(SLOTS.map((s) => [s.code, s])) as Record<BannerSlot, SlotSpec>;

export const clickHref = (id: string) => `/api/pub/clic/${id}`;

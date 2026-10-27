import type { BannerSlot } from "@prisma/client";
import { listBanners } from "@/lib/pub";
import { SLOT_BY_CODE } from "@/lib/pub-slots";
import { PubCarousel } from "./pub-carousel";

/* Emplacement publicitaire. Composant serveur : charge les campagnes actives
   de l'emplacement (vendues, sinon maison), les mélange, et confie le
   défilement au carrousel. Ne rend rien s'il n'y a rien à diffuser.
   Pas de mention visible (choix Josué) : le caractère publicitaire reste
   signalé aux lecteurs d'écran (aria-label) et aux moteurs (rel=sponsored). */

export async function AdSlot({ slot, section, className = "" }: { slot: BannerSlot; section?: string; className?: string }) {
  const pool = await listBanners(slot, { section });
  if (pool.length === 0) return null;
  const spec = SLOT_BY_CODE[slot];
  const tall = slot === "SIDE";
  const slides = pool.map((b) => ({ id: b.id, kind: b.kind, advertiser: b.advertiser, alt: b.alt, image: b.image, imageMobile: b.imageMobile, photo: b.photo, headline: b.headline, tagline: b.tagline, bg: b.bg, fg: b.fg }));

  return (
    <div className={`pub ${className}`} data-slot={slot}>
      <PubCarousel slides={slides} tall={tall} width={spec.desktop.w} height={spec.desktop.h} />
    </div>
  );
}

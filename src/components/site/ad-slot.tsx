import Image from "next/image";
import { pickBanner, recordImpression, clickHref, SLOT_BY_CODE } from "@/lib/pub";
import type { BannerSlot } from "@prisma/client";

/* Emplacement publicitaire. Composant serveur : choisit une campagne active
   (vendue, sinon maison), compte l'affichage, et ne rend rien s'il n'y a
   rien à diffuser — jamais de cadre vide ni de faux contenu. */

export async function AdSlot({ slot, section, className = "" }: { slot: BannerSlot; section?: string; className?: string }) {
  const b = await pickBanner(slot, { section });
  if (!b) return null;
  recordImpression(b.id);
  const spec = SLOT_BY_CODE[slot];
  const tall = slot === "SIDE";
  const mobileImg = b.imageMobile ?? b.image;

  return (
    <div className={`pub ${className}`} data-slot={slot}>
      <a
        href={clickHref(b.id)}
        target="_blank"
        rel="noopener nofollow sponsored"
        aria-label={`${b.alt} (publicité, ${b.advertiser})`}
        className={`block overflow-hidden rounded border border-line ${tall ? "" : "mx-auto"}`}
        style={{ maxWidth: spec.desktop.w }}
      >
        {b.kind === "IMAGE" && b.image ? (
          <>
            <Image src={b.image} alt={b.alt} width={spec.desktop.w} height={spec.desktop.h} className={`h-auto w-full ${mobileImg !== b.image ? "hidden sm:block" : ""}`} unoptimized={b.image.startsWith("http")} />
            {mobileImg && mobileImg !== b.image && (
              <Image src={mobileImg} alt={b.alt} width={spec.mobile.w} height={spec.mobile.h} className="h-auto w-full sm:hidden" unoptimized={mobileImg.startsWith("http")} />
            )}
          </>
        ) : (
          <div
            className={`flex items-center gap-4 px-4 ${tall ? "h-[250px] flex-col justify-center text-center" : "h-[90px] max-sm:h-[100px]"}`}
            style={{ background: b.bg ?? "var(--color-primary-darker)", color: b.fg ?? "#fff" }}
          >
            {b.image && (
              <Image src={b.image} alt="" width={tall ? 120 : 64} height={tall ? 120 : 64} className={`shrink-0 object-contain ${tall ? "h-24 w-auto" : "h-14 w-auto"}`} unoptimized={b.image.startsWith("http")} />
            )}
            <div className="min-w-0">
              <p className={`font-display font-extrabold leading-tight ${tall ? "text-xl" : "text-base sm:text-lg"}`}>{b.headline ?? b.advertiser}</p>
              {b.tagline && <p className={`mt-0.5 opacity-90 ${tall ? "text-sm" : "line-clamp-2 text-xs sm:text-sm"}`}>{b.tagline}</p>}
            </div>
          </div>
        )}
      </a>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-muted">Publicité · {b.advertiser}</p>
    </div>
  );
}

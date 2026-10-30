/* eslint-disable @next/next/no-img-element -- visuels publicitaires externes, dimensions fixes */
"use client";

import { useEffect, useRef, useState } from "react";
import { clickHref } from "@/lib/pub-slots";

/* Carrousel publicitaire : toutes les campagnes de l'emplacement défilent
   (glissement horizontal, 6 s par vue, pause au survol, balayage tactile,
   fondu simple si l'utilisateur préfère moins d'animations). Chaque campagne
   montrée est signalée une fois au serveur pour le comptage. */

export type Slide = {
  id: string;
  kind: "IMAGE" | "CARD";
  advertiser: string;
  alt: string;
  image: string | null;
  imageMobile: string | null;
  photo: string | null;
  headline: string | null;
  tagline: string | null;
  cta: string | null;
  bg: string | null;
  fg: string | null;
};

const DUREE = 6000;

export function PubCarousel({ slides, tall, width, height }: { slides: Slide[]; tall: boolean; width: number; height: number }) {
  const [i, setI] = useState(0);
  const [pause, setPause] = useState(false);
  const vus = useRef(new Set<string>());
  const touch = useRef<number | null>(null);
  const n = slides.length;

  useEffect(() => {
    const s = slides[i];
    if (s && !vus.current.has(s.id)) {
      vus.current.add(s.id);
      try {
        const ok = navigator.sendBeacon?.(`/api/pub/vue/${s.id}`);
        if (!ok) fetch(`/api/pub/vue/${s.id}`, { method: "POST", keepalive: true }).catch(() => {});
      } catch {}
    }
  }, [i, slides]);

  useEffect(() => {
    if (n < 2 || pause) return;
    const t = setTimeout(() => setI((x) => (x + 1) % n), DUREE);
    return () => clearTimeout(t);
  }, [i, n, pause]);

  if (n === 0) return null;

  return (
    <div
      className={`pub-carousel group relative mx-auto w-full overflow-hidden border border-ink/15 bg-ink shadow-[0_14px_40px_-16px_rgba(0,0,0,.45)] ${tall ? "aspect-[300/600]" : "h-[200px] sm:h-auto sm:[aspect-ratio:var(--ar)]"}`}
      style={{ maxWidth: width, "--ar": `${width} / ${height}` } as React.CSSProperties}
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; setPause(true); }}
      onTouchEnd={(e) => {
        const dx = touch.current === null ? 0 : e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) setI((x) => (x + (dx < 0 ? 1 : n - 1)) % n);
        touch.current = null; setPause(false);
      }}
      aria-roledescription="carrousel"
      aria-label={`Publicités (${n})`}
    >
      <ul
        className="flex h-full transition-transform duration-700 ease-[cubic-bezier(.22,.61,.36,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {slides.map((s, k) => (
          <li key={s.id} className="relative h-full w-full shrink-0" aria-hidden={k !== i}>
            <SlideView s={s} tall={tall} active={k === i} />
          </li>
        ))}
      </ul>

      {n > 1 && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-white/20">
            <div
              key={`${i}-${pause}`}
              className="h-full bg-accent motion-reduce:animate-none"
              style={{ width: pause ? "100%" : undefined, animation: pause ? "none" : `pub-progress ${DUREE}ms linear forwards` }}
            />
          </div>
          <div className={`absolute flex gap-1.5 ${tall ? "bottom-4 right-4" : "bottom-4 right-4"}`} role="tablist">
            {slides.map((s, k) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={k === i}
                aria-label={`Voir ${s.advertiser}`}
                onClick={() => setI(k)}
                className={`h-1.5 transition-all ${k === i ? "w-7 bg-accent" : "w-2.5 bg-white/60 hover:bg-white"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SlideView({ s, tall, active }: { s: Slide; tall: boolean; active: boolean }) {
  const tint = s.bg ?? "#0b3d2e";
  const fg = s.fg ?? "#ffffff";
  const href = clickHref(s.id);
  const rel = "noopener nofollow sponsored";

  if (s.kind === "IMAGE" && s.image) {
    const mobile = s.imageMobile ?? s.image;
    return (
      <a href={href} target="_blank" rel={rel} aria-label={`${s.alt} (publicité, ${s.advertiser})`} className="block h-full w-full">
        <img src={s.image} alt={s.alt} className={`h-full w-full object-cover ${mobile !== s.image ? "hidden sm:block" : ""}`} />
        {mobile !== s.image && <img src={mobile} alt={s.alt} className="h-full w-full object-cover sm:hidden" />}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel={rel}
      aria-label={`${s.alt} (publicité, ${s.advertiser})`}
      className="relative block h-full w-full overflow-hidden"
      style={{ color: fg, background: tint }}
    >
      {s.photo && (
        <img
          src={s.photo}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[8000ms] ease-linear ${active ? "scale-110" : "scale-100"}`}
          style={{ objectPosition: tall ? "center 25%" : "center 45%" }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: tall
            ? `linear-gradient(180deg, ${tint}26 0%, ${tint}33 40%, ${tint}f5 78%, ${tint}ff 100%)`
            : `linear-gradient(90deg, ${tint}f5 0%, ${tint}e0 42%, ${tint}66 66%, ${tint}14 100%)`,
        }}
      />
      <div className="wax-bg-soft absolute inset-0 mix-blend-soft-light" />

      {tall ? (
        <div className="relative flex h-full flex-col justify-between p-6">
          {s.image && (
            <span className="inline-flex h-20 w-20 items-center justify-center bg-white p-2 shadow-md">
              <img src={s.image} alt="" className="h-full w-full object-contain" />
            </span>
          )}
          <div>
            <p className="font-display text-[2rem] font-extrabold leading-[1.02] tracking-tight drop-shadow-md">{s.headline ?? s.advertiser}</p>
            {s.tagline && <p className="mt-3 text-[15px] leading-snug opacity-95 drop-shadow">{s.tagline}</p>}
            <span className="mt-5 inline-flex items-center gap-2 bg-accent px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-ink transition group-hover:bg-accent-dark">
              {s.cta ?? "Découvrir"} <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="relative flex h-full items-center gap-5 px-5 sm:gap-8 sm:px-10">
          {s.image && (
            <span className="hidden h-24 w-24 shrink-0 items-center justify-center bg-white p-2.5 shadow-md sm:inline-flex">
              <img src={s.image} alt="" className="h-full w-full object-contain" />
            </span>
          )}
          <div className="min-w-0 max-w-[62%] sm:max-w-[55%]">
            <p className="font-display text-[1.6rem] font-extrabold leading-[1.02] tracking-tight drop-shadow-md sm:text-[2.6rem]">{s.headline ?? s.advertiser}</p>
            {s.tagline && <p className="mt-2 line-clamp-2 text-[13px] leading-snug opacity-95 drop-shadow sm:mt-3 sm:line-clamp-2 sm:text-base">{s.tagline}</p>}
            <span className="mt-3 inline-flex items-center gap-2 bg-accent px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-ink transition group-hover:bg-accent-dark sm:mt-5 sm:px-6 sm:py-3 sm:text-sm">
              {s.cta ?? "Découvrir"} <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      )}
    </a>
  );
}

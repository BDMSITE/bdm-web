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
      className={`pub-carousel group relative mx-auto w-full overflow-hidden rounded-xl bg-ink shadow-[0_8px_30px_-12px_rgba(0,0,0,.35)] ${tall ? "aspect-[300/250]" : "h-[100px] sm:h-auto sm:[aspect-ratio:var(--ar)]"}`}
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
          <div className={`absolute flex gap-1.5 ${tall ? "bottom-3 right-3" : "right-3 top-1/2 -translate-y-1/2 max-sm:hidden"}`} role="tablist">
            {slides.map((s, k) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={k === i}
                aria-label={`Voir ${s.advertiser}`}
                onClick={() => setI(k)}
                className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-accent" : "w-1.5 bg-white/60 hover:bg-white"}`}
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
          style={{ objectPosition: tall ? "center 30%" : "center 40%" }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: tall
            ? `linear-gradient(180deg, ${tint}00 0%, ${tint}55 45%, ${tint}f2 100%)`
            : `linear-gradient(90deg, ${tint}f7 0%, ${tint}e6 38%, ${tint}66 62%, ${tint}1a 100%)`,
        }}
      />
      <div className="wax-bg-soft absolute inset-0 mix-blend-soft-light" />

      {tall ? (
        <div className="relative flex h-full flex-col justify-between p-4">
          {s.image && (
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/95 p-1.5 shadow-md">
                    <img src={s.image} alt="" className="h-full w-full object-contain" />
            </span>
          )}
          <div>
            <p className="font-display text-[1.45rem] font-extrabold leading-[1.05] tracking-tight drop-shadow-sm">{s.headline ?? s.advertiser}</p>
            {s.tagline && <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug opacity-90">{s.tagline}</p>}
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink transition group-hover:bg-accent-dark">
              Découvrir <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="relative flex h-full items-center gap-3 pl-3 pr-14 sm:gap-4 sm:pl-4 sm:pr-24">
          {s.image && (
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/95 p-1.5 shadow-md sm:h-14 sm:w-14 sm:rounded-xl">
                    <img src={s.image} alt="" className="h-full w-full object-contain" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-extrabold leading-tight tracking-tight sm:text-xl">{s.headline ?? s.advertiser}</p>
            {s.tagline && <p className="line-clamp-2 text-[11px] leading-snug opacity-90 sm:line-clamp-1 sm:text-[13px]">{s.tagline}</p>}
          </div>
          <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink transition group-hover:bg-accent-dark sm:inline-flex">
            Découvrir <span aria-hidden>→</span>
          </span>
        </div>
      )}
    </a>
  );
}

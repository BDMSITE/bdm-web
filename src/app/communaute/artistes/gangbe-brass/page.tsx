import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, KeywordChips } from "@/components/site/chrome";
import { Play } from "lucide-react";

export const metadata: Metadata = { title: "Gangbé Brass Band — Artiste" };

/* MAQUETTE — Fiche artiste avec agenda de dates (CDC §7.5), données d'exemple. */

const DATES = [
  { d: "VEN 17 OCT", v: "Transbordeur — Lyon · France", s: "Billets" },
  { d: "SAM 18 OCT", v: "Le Guess Who — Utrecht · Pays-Bas", s: "Billets" },
  { d: "SAM 13 DÉC", v: "Palais des Congrès — Cotonou · Bénin", s: "Bientôt" },
];

export default function ArtistePage() {
  return (
    <>
      <SiteHeader />

      <div className="wax-bg bg-primary-darker py-8 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-5 px-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-accent font-display text-4xl font-extrabold text-ink">
            G
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-extrabold leading-tight">Gangbé Brass Band*</h1>
            <p className="mt-1 text-sm uppercase tracking-wider text-white/80">
              Fanfare · musique vodun-jazz · Cotonou · Bénin
            </p>
            <p className="mt-1 text-xs text-white/60">* fiche d&apos;exemple · membre depuis 2026 · 2 contenus publiés</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <button className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
              Booking (relais)
            </button>
            <button className="whitespace-nowrap rounded border-2 border-white/60 px-4 py-2 text-sm font-bold hover:border-accent hover:text-accent">
              Suivre
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">Bio<em>graphie</em></h2>
              <p className="max-w-2xl leading-relaxed">
                Née à Cotonou, la fanfare mêle cuivres, percussions vodun et chants en fon.
                Plus de vingt ans de tournées internationales, des scènes de Lagos à Roskilde,
                et un nouvel album enregistré entre Cotonou et Bruxelles.
              </p>
              <div className="mt-4">
                <KeywordChips keywords={["Musique", "Fanfare", "Vodun & culture", "Cotonou", "Tournée"]} />
              </div>
            </section>

            <section>
              <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">Prochaines <em>dates</em></h2>
              <ul className="space-y-3">
                {DATES.map((e) => (
                  <li key={e.v} className="flex flex-wrap items-center gap-4 border border-line p-4 hover:border-primary hover:bg-primary-faint">
                    <span className="w-24 shrink-0 whitespace-nowrap rounded bg-primary px-2 py-2 text-center text-[0.7rem] font-bold uppercase text-white">{e.d}</span>
                    <p className="min-w-0 flex-1 font-bold leading-snug">{e.v}</p>
                    <button className="shrink-0 whitespace-nowrap rounded border-2 border-primary px-3 py-1.5 text-xs font-bold uppercase text-primary hover:bg-primary hover:text-white">{e.s}</button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">Les dates sont publiées par l&apos;artiste et reprises dans l&apos;agenda du site.</p>
            </section>

            <section>
              <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">Écouter / <em>voir</em></h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {["Clip — Noubioto", "Live — Jazz à Ouaga", "Interview RFI"].map((m) => (
                  <button key={m} className="group relative aspect-video border border-line bg-primary-darker text-left">
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Play aria-hidden className="h-10 w-10 text-accent group-hover:scale-110" strokeWidth={1.5} />
                    </span>
                    <span className="absolute bottom-2 left-3 text-xs font-bold text-white">{m}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">Programmer <em>cet artiste ?</em></h3>
              <p className="mt-2 text-sm text-ink-2">Associations, salles, festivals : contactez le groupe par la messagerie relais.</p>
              <button className="mt-3 w-full whitespace-nowrap rounded bg-primary py-2 text-sm font-bold text-white hover:bg-primary-dark">Demander un booking</button>
            </div>
            <div className="border border-line bg-paper-2 p-4 text-sm">
              <h3 className="section-title text-sm">Artistes <em>proches</em></h3>
              <ul className="mt-3 space-y-2">
                {["DJ Wari — Paris", "Sena K. — Montréal", "Troupe Agbadja — Lomé"].map((a) => (
                  <li key={a}><Link href="/communaute/artistes" className="font-semibold hover:text-primary">{a}</Link></li>
                ))}
              </ul>
            </div>
            <AdSlot label="pavé latéral" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

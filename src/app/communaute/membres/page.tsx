import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, AlertsBox } from "@/components/site/chrome";

export const metadata: Metadata = { title: "Annuaire des membres" };

/* MAQUETTE — Annuaire des membres (CDC §7.5), profils d'exemple. */

const MEMBRES: { name: string; city: string; sectors: string[]; pub: number; cv: boolean; afro?: boolean }[] = [
  { name: "Aïchatou S.", city: "COTONOU · BÉNIN", sectors: ["BTP", "Entrepreneuriat"], pub: 3, cv: false },
  { name: "Jean-Eudes K.", city: "PARIS · FRANCE", sectors: ["Informatique"], pub: 1, cv: true },
  { name: "Mariam A.", city: "MONTRÉAL · CANADA", sectors: ["Santé", "Recherche"], pub: 0, cv: true, afro: true },
  { name: "Rodrigue H.", city: "BRUXELLES · BELGIQUE", sectors: ["Finance"], pub: 2, cv: false },
  { name: "Grâce D.", city: "ABIDJAN · CÔTE D'IVOIRE", sectors: ["Commerce", "Logistique"], pub: 0, cv: false },
  { name: "Ulrich T.", city: "COTONOU · BÉNIN", sectors: ["Éducation"], pub: 5, cv: false },
  { name: "Nadège G.", city: "NEW YORK · USA", sectors: ["Droit"], pub: 1, cv: true, afro: true },
  { name: "Comlan V.", city: "LOMÉ · TOGO", sectors: ["Agriculture"], pub: 0, cv: false },
  { name: "Élodie Z.", city: "MARSEILLE · FRANCE", sectors: ["Art & spectacle"], pub: 4, cv: false },
];

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function MembresPage() {
  return (
    <>
      <SiteHeader />

      {/* Bandeau de rubrique */}
      <div className="wax-bg bg-primary-darker py-8 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="section-title text-2xl md:text-3xl">
            Tous les <em className="!text-accent">membres</em>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            La diaspora béninoise et les Béninois du pays, par ville et par secteur. Inscrivez-vous
            gratuitement pour apparaître dans l&apos;annuaire et publier.
          </p>
        </div>
      </div>

      {/* Recherche + filtres */}
      <div className="border-b border-line bg-paper-2">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Nom, profession, ville…"
            className="w-full sm:w-64 rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <select className="rounded border border-line bg-paper px-3 py-2 text-sm">
            <option>Tous les pays</option>
            <option>Bénin</option>
            <option>France</option>
            <option>Canada</option>
            <option>Belgique</option>
            <option>USA</option>
          </select>
          <select className="rounded border border-line bg-paper px-3 py-2 text-sm">
            <option>Tous les secteurs</option>
            <option>Informatique</option>
            <option>Santé</option>
            <option>Finance</option>
            <option>BTP</option>
          </select>
          <button className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
            Rechercher
          </button>
          <button className="ml-auto text-sm font-bold uppercase text-primary hover:underline">
            Voir sur la carte
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            {/* Index A–Z + compteur */}
            <div className="mb-5 flex flex-wrap items-center gap-1">
              {ALPHA.map((l) => (
                <button
                  key={l}
                  className="h-7 w-7 rounded text-xs font-bold text-ink-2 hover:bg-primary hover:text-white"
                >
                  {l}
                </button>
              ))}
              <span className="ml-auto text-sm text-muted">
                <strong className="text-ink">1 254</strong> membres
              </span>
            </div>

            {/* Grille de profils */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {MEMBRES.map((m) => (
                <article
                  key={m.name}
                  className="border border-line p-4 hover:border-primary hover:bg-primary-faint"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 rounded-full bg-primary-light flex items-center justify-center font-display font-bold text-primary-dark">
                      {m.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold leading-tight">
                        <Link href="/communaute/membres/aichatou-s" className="hover:text-primary">
                          {m.name}
                        </Link>
                      </h2>
                      <p className="card-location mt-0.5">{m.city}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.sectors.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-paper-2 border border-line px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-2"
                      >
                        {s}
                      </span>
                    ))}
                    {m.cv && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-ink">
                        CV publié
                      </span>
                    )}
                    {m.afro && (
                      <span className="rounded-full border border-primary bg-primary-faint px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-primary-dark">
                        Afrodescendant·e
                      </span>
                    )}
                  </div>
                  {m.pub > 0 && (
                    <p className="mt-2 text-xs text-muted">
                      {m.pub} contenu{m.pub > 1 ? "s" : ""} publié{m.pub > 1 ? "s" : ""}
                    </p>
                  )}
                </article>
              ))}
            </div>

            <button className="mt-6 w-full rounded border-2 border-primary py-2.5 text-sm font-bold uppercase text-primary hover:bg-primary hover:text-white">
              Afficher plus de résultats
            </button>
          </div>

          {/* Colonne latérale */}
          <aside className="space-y-8">
            <div className="border-2 border-primary bg-primary-faint p-4 text-center">
              <p className="font-display text-lg font-bold">Rejoindre la communauté</p>
              <p className="mt-1 text-sm text-ink-2">
                Inscrivez-vous et publiez directement vos articles, offres et événements.
              </p>
              <Link
                href="/publier"
                className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark"
              >
                Je m&apos;inscris
              </Link>
            </div>
            <AlertsBox keywords={["Informatique", "Paris", "Santé", "Montréal"]} />
            <AdSlot label="pavé latéral" />
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

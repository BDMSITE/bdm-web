import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, KeywordChips } from "@/components/site/chrome";

export const metadata: Metadata = { title: "Bénin Diaspora Île-de-France — Association" };

/* MAQUETTE — Fiche association (CDC §7.5), données d'exemple. */

const EVENTS = [
  { t: "Pique-nique des Béninois d'Île-de-France", d: "SAM 27 SEPT · 12h00", c: "Paris" },
  { t: "Assemblée générale annuelle", d: "DIM 19 OCT · 14h00", c: "Paris 19e" },
  { t: "Fête de fin d'année de la communauté", d: "SAM 13 DÉC · 19h00", c: "Montreuil" },
];

export default function AssociationPage() {
  return (
    <>
      <SiteHeader />

      <div className="wax-bg bg-primary-darker py-8 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-5 px-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-white font-display text-xl font-extrabold text-primary-darker">
            LOGO
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-extrabold leading-tight">Bénin Diaspora Île-de-France</h1>
            <p className="mt-1 text-sm uppercase tracking-wider text-white/80">
              Association culturelle et d&apos;entraide · Paris · France
            </p>
            <p className="mt-1 text-xs text-white/60">Fondée en 2011 · ~230 membres · 4 contenus publiés</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <button className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
              Adhérer à l&apos;association
            </button>
            <button className="whitespace-nowrap rounded border-2 border-white/60 px-4 py-2 text-sm font-bold hover:border-accent hover:text-accent">
              Écrire (relais)
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">Notre <em>objet</em></h2>
              <p className="max-w-2xl leading-relaxed">
                Depuis 2011, l&apos;association rassemble les Béninois d&apos;Île-de-France :
                événements culturels, entraide aux nouveaux arrivants, soutien scolaire,
                et le grand pique-nique annuel du bois de Vincennes.
              </p>
              <div className="mt-4">
                <KeywordChips keywords={["Culture", "Entraide", "Paris", "Île-de-France"]} />
              </div>
            </section>

            <section>
              <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">Prochains <em>événements</em></h2>
              <ul className="space-y-3">
                {EVENTS.map((e) => (
                  <li key={e.t} className="flex flex-wrap items-center gap-4 border border-line p-4 hover:border-primary hover:bg-primary-faint">
                    <span className="w-24 shrink-0 whitespace-nowrap rounded bg-primary px-2 py-2 text-center text-[0.68rem] font-bold uppercase leading-tight text-white">{e.d}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-snug"><Link href="/agenda/evenement-exemple" className="hover:text-primary">{e.t}</Link></p>
                      <p className="card-location mt-0.5">{e.c}</p>
                    </div>
                    <Link href="/agenda/evenement-exemple" className="shrink-0 whitespace-nowrap rounded border-2 border-primary px-3 py-1.5 text-xs font-bold uppercase text-primary hover:bg-primary hover:text-white">Voir</Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="grid max-w-2xl gap-x-8 gap-y-3 border border-line p-5 text-sm sm:grid-cols-2">
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Président·e</p><p className="mt-0.5">Nom à venir</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Adhésion</p><p className="mt-0.5">20 € / an (à titre d&apos;exemple)</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Site / réseaux</p><p className="mt-0.5 font-semibold text-primary">benindiaspora-idf.example</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Contact</p><p className="mt-0.5 italic text-muted">Par formulaire relais uniquement</p></div>
            </section>
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary bg-primary-faint p-4 text-center">
              <p className="font-display text-lg font-bold">Votre asso aussi ?</p>
              <p className="mt-1 text-sm text-ink-2">Créez sa fiche gratuite et publiez vos événements.</p>
              <Link href="/inscription" className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                Créer un compte association
              </Link>
            </div>
            <div className="border border-line bg-paper-2 p-4 text-sm">
              <h3 className="section-title text-sm">Associations <em>proches</em></h3>
              <ul className="mt-3 space-y-2">
                {["ASBL Racines Bénin — Bruxelles", "Amicale des Écureuils — Lyon", "Solidarité Bénin USA — New York"].map((a) => (
                  <li key={a}><Link href="/communaute/associations" className="font-semibold hover:text-primary">{a}</Link></li>
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

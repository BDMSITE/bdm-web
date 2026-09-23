import Link from "next/link";
import type { Metadata } from "next";
import {
  SiteHeader,
  SiteFooter,
  AdSlot,
  PageBanner,
  FilterBar,
} from "@/components/site/chrome";
import { BadgeCheck } from "lucide-react";

export const metadata: Metadata = { title: "Compétences de la diaspora" };

/* MAQUETTE — Annuaire des compétences : les experts béninois de l'extérieur
   mobilisables pour des projets au Bénin (initiative HCBE). Profils d'exemple.
   Mise en relation par formulaire relais, validation en modération. */

const EXPERTS: {
  name: string;
  role: string;
  city: string;
  domains: string[];
  dispo: string[];
}[] = [
  { name: "Dr Mariam A.", role: "Médecin de santé publique", city: "MONTRÉAL · CANADA", domains: ["Santé", "Recherche"], dispo: ["Mentorat", "Missions courtes"] },
  { name: "Jean-Eudes K.", role: "Architecte logiciel", city: "PARIS · FRANCE", domains: ["Informatique"], dispo: ["Mentorat", "À distance"] },
  { name: "Rodrigue H.", role: "Analyste financier senior", city: "BRUXELLES · BELGIQUE", domains: ["Finance"], dispo: ["Missions courtes"] },
  { name: "Nadège G.", role: "Avocate d'affaires", city: "NEW YORK · USA", domains: ["Droit"], dispo: ["Conseil", "À distance"] },
  { name: "Aïchatou S.", role: "Ingénieure BTP", city: "COTONOU · BÉNIN", domains: ["BTP", "Infrastructures"], dispo: ["Mentorat"] },
  { name: "Prof. Ulrich T.", role: "Enseignant-chercheur", city: "COTONOU · BÉNIN", domains: ["Éducation"], dispo: ["Formation", "Mentorat"] },
];

export default function CompetencesPage() {
  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Compétences de la"
        em="diaspora"
        desc="Médecins, ingénieurs, juristes, enseignants… La diaspora est une ressource pour le Bénin. Le HCBE met en relation les experts de l'extérieur avec les projets du pays : mentorat, missions courtes, conseil à distance."
      >
        <Link
          href="/publier"
          className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark"
        >
          Proposer mes compétences
        </Link>
      </PageBanner>

      <FilterBar
        placeholder="Métier, expertise, ville…"
        selects={[
          { label: "Pays", options: ["Tous les pays", "France", "Canada", "Belgique", "USA", "Bénin"] },
          { label: "Domaine", options: ["Tous les domaines", "Santé", "Informatique", "Finance", "Droit", "BTP", "Éducation"] },
          { label: "Disponibilité", options: ["Toutes disponibilités", "Mentorat", "Missions courtes", "Conseil à distance", "Formation"] },
        ]}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <p className="mb-5 text-sm text-muted">
              <strong className="text-ink">87</strong> experts vérifiés ·{" "}
              <strong className="text-ink">23</strong> pays — profils validés par le HCBE
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {EXPERTS.map((e) => (
                <article
                  key={e.name}
                  className="card-soft flex flex-col border border-line bg-paper p-4 hover:border-primary"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-light font-display font-bold text-primary-dark">
                      {e.name.replace("Dr ", "").replace("Prof. ", "")[0]}
                    </div>
                    <div className="min-w-0">
                      <h2 className="flex items-center gap-1.5 font-bold leading-tight">
                        {e.name}
                        <BadgeCheck aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                      </h2>
                      <p className="text-sm text-ink-2">{e.role}</p>
                      <p className="card-location mt-0.5">{e.city}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {e.domains.map((d) => (
                      <span key={d} className="rounded-full border border-line bg-paper-2 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-2">
                        {d}
                      </span>
                    ))}
                    {e.dispo.map((d) => (
                      <span key={d} className="rounded-full bg-primary-light px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-primary-dark">
                        {d}
                      </span>
                    ))}
                  </div>
                  <button className="mt-4 w-full rounded border-2 border-primary py-1.5 text-xs font-bold uppercase text-primary hover:bg-primary hover:text-white">
                    Proposer une mission
                  </button>
                </article>
              ))}
            </div>

            <button className="mt-6 w-full rounded border-2 border-primary py-2.5 text-sm font-bold uppercase text-primary hover:bg-primary hover:text-white">
              Afficher plus de résultats
            </button>
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">
                Partager son <em>expertise</em>
              </h3>
              <p className="mt-2 text-sm text-ink-2">
                Vous exercez à l&apos;étranger et voulez contribuer à un projet au Bénin ?
                Décrivez vos compétences et vos disponibilités — le HCBE valide chaque profil.
              </p>
              <Link
                href="/publier"
                className="mt-3 inline-block w-full rounded bg-primary py-2 text-center text-sm font-bold text-white hover:bg-primary-dark"
              >
                Créer mon profil expert
              </Link>
            </div>
            <div className="border border-line bg-paper-2 p-4 text-sm text-ink-2">
              <p className="font-bold text-ink">Comment ça marche ?</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4">
                <li>L&apos;expert décrit compétences et disponibilités</li>
                <li>Le HCBE vérifie et publie le profil</li>
                <li>Porteurs de projets et institutions proposent une mission (contact par relais, e-mail jamais exposé)</li>
              </ol>
            </div>
            <AdSlot label="pavé latéral" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

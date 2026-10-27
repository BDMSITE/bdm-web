import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, PageBanner, SectionTitle } from "@/components/site/chrome";
import { EmptyState } from "@/components/site/content";
import { Stethoscope, Scale, Cpu, GraduationCap } from "lucide-react";

export const metadata: Metadata = { title: "Compétences de la diaspora" };

/* Compétences de la diaspora : initiative du HCBE pour relier les expertises
   de l'extérieur aux projets du Bénin. Pas encore de profils « expert » en base :
   la page présente le principe et affiche un état vide honnête. */

const DOMAINES = [
  { icon: Stethoscope, t: "Santé", d: "Médecins, soignants, chercheurs." },
  { icon: Cpu, t: "Ingénierie & numérique", d: "Ingénieurs, développeurs, architectes." },
  { icon: Scale, t: "Droit & finance", d: "Juristes, analystes, gestionnaires." },
  { icon: GraduationCap, t: "Enseignement & recherche", d: "Enseignants, formateurs, chercheurs." },
];

export default function CompetencesPage() {
  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Compétences de la"
        em="diaspora"
        desc="La diaspora est une ressource pour le Bénin. Le HCBE souhaite mettre en relation les Béninois de l'extérieur avec les projets du pays : mentorat, missions courtes, conseil à distance."
      >
        <Link href="/compte/profil" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
          Proposer mes compétences
        </Link>
      </PageBanner>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <SectionTitle pre="Le" em="principe" />
              <ol className="grid gap-4 sm:grid-cols-3">
                {[
                  { t: "Vous décrivez vos compétences", d: "Dans votre profil : métier, secteur, disponibilités (mentorat, mission courte, conseil à distance)." },
                  { t: "Le HCBE vérifie", d: "Chaque profil expert est relu avant d'apparaître dans cette rubrique." },
                  { t: "Les projets vous contactent", d: "Par le formulaire relais du site : votre e-mail n'est jamais exposé." },
                ].map((s, i) => (
                  <li key={s.t} className="border border-line p-5">
                    <span className="font-display text-3xl font-black text-line">{i + 1}</span>
                    <h3 className="mt-1 font-bold">{s.t}</h3>
                    <p className="mt-1 text-sm text-ink-2">{s.d}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <SectionTitle pre="Domaines" em="recherchés" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {DOMAINES.map((d) => (
                  <article key={d.t} className="border border-line p-4">
                    <d.icon aria-hidden className="h-7 w-7 text-primary" strokeWidth={2.2} />
                    <h3 className="mt-2 font-bold">{d.t}</h3>
                    <p className="mt-1 text-sm text-ink-2">{d.d}</p>
                  </article>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">Liste indicative : toutes les expertises utiles au Bénin sont les bienvenues.</p>
            </section>

            <section>
              <SectionTitle pre="Les" em="experts" />
              <EmptyState
                title="Les premiers profils experts arrivent"
                text="Cette rubrique s'ouvre dès que les premiers profils auront été vérifiés par le HCBE. Vous exercez à l'étranger et voulez contribuer à un projet au Bénin ? Complétez votre profil."
                href="/compte/profil"
                cta="Compléter mon profil"
              />
            </section>
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">
                Partager son <em>expertise</em>
              </h3>
              <p className="mt-2 text-sm text-ink-2">
                Décrivez vos compétences et vos disponibilités dans votre profil : le HCBE relit chaque profil avant de le publier ici.
              </p>
              <Link href="/compte/profil" className="mt-3 inline-block w-full rounded bg-primary py-2 text-center text-sm font-bold text-white hover:bg-primary-dark">
                Compléter mon profil
              </Link>
            </div>
            <div className="border border-line bg-paper-2 p-4 text-sm text-ink-2">
              <p className="font-bold text-ink">Vous portez un projet au Bénin ?</p>
              <p className="mt-2">Institution, entreprise, association : dites-nous quelles expertises vous cherchez.</p>
              <Link href="/contact" className="mt-3 inline-block whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline">
                Nous écrire →
              </Link>
            </div>
            <AdSlot slot="SIDE" section="communaute" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

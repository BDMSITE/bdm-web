import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, SectionTitle, AdSlot, PageBanner, LangSwitch } from "@/components/site/chrome";
import { Compass, LibraryBig, BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Mémoire & racines" };

/* MAQUETTE — Espace mémoire repris de l'ancien site (CDC §7.11) : 24 lieux, itinéraires, bibliothèque, guides. */

const LIEUX = [
  { name: "Porte du Non-Retour", city: "OUIDAH", theme: "Traite atlantique" },
  { name: "Route de l'Esclave", city: "OUIDAH", theme: "Itinéraire mémoriel" },
  { name: "Palais royaux d'Abomey", city: "ABOMEY", theme: "Royaume du Danxomè" },
  { name: "Temple des Pythons", city: "OUIDAH", theme: "Vodun" },
];

export default function MemoirePage() {
  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Mémoire &"
        em="racines"
        desc="Pour les afro-descendants en quête d'origines et tous les Béninois : lieux de mémoire, itinéraires, bibliothèque culturelle et guides pratiques. Contenus validés historiquement."
      >
        <Link href="/adresses" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
          Professionnels vérifiés (généalogie)
        </Link>
        <LangSwitch fr="/memoire" en="/en/roots" current="fr" />
      </PageBanner>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <SectionTitle pre="La carte" em="mémorielle" />
              <div className="flex aspect-[21/9] items-center justify-center border border-line bg-[#dfe9e2] text-sm text-muted">
                carte des 24 lieux de mémoire (MapLibre)
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {LIEUX.map((l) => (
                  <article key={l.name} className="border border-line hover:border-primary">
                    <div className="aspect-[4/3] bg-paper-2" />
                    <div className="p-3">
                      <p className="card-location">{l.city}</p>
                      <h3 className="mt-1 font-bold leading-tight">{l.name}</h3>
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">{l.theme}</p>
                    </div>
                  </article>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">24 lieux documentés et sourcés — repris de l&apos;ancien site, validés par la rédaction.</p>
            </section>

            {/* Nationalité afrodescendante — loi n° 2024-31, programme My Afro Origins */}
            <section>
              <SectionTitle pre="Devenir Béninois·e : la" em="nationalité" />
              <p className="text-sm leading-relaxed text-ink-2">
                Depuis la loi n° 2024-31, le Bénin reconnaît la nationalité aux
                afrodescendants dont un ancêtre a été déporté par la traite. La demande se fait
                en ligne via le programme officiel <strong>My Afro Origins</strong>.
              </p>
              <ol className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { t: "Vérifier son éligibilité", d: "Un ancêtre subsaharien déporté hors d'Afrique (traite atlantique)." },
                  { t: "Constituer le dossier", d: "Preuves d'ascendance : actes, tests ADN reconnus, généalogie documentée." },
                  { t: "Déposer en ligne", d: "Sur le portail officiel My Afro Origins ; instruction par l'État béninois." },
                  { t: "Obtenir la nationalité", d: "Attestation puis carte d'identité — et un pays qui vous accueille." },
                ].map((s, i) => (
                  <li key={s.t} className="card-soft border border-line bg-paper p-4">
                    <span aria-hidden className="font-script text-3xl leading-none text-primary">
                      {i + 1}
                    </span>
                    <h3 className="mt-1 font-bold leading-tight">{s.t}</h3>
                    <p className="mt-1 text-sm text-ink-2">{s.d}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href="#"
                  className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark"
                >
                  Lire le guide complet
                </Link>
                <p className="text-xs text-muted">
                  Guide informatif — les démarches officielles se font sur le portail national.
                </p>
              </div>
            </section>

            {/* Éditorial Agudas */}
            <section className="card-soft flex flex-col gap-5 border border-line bg-paper p-5 sm:flex-row">
              <div className="flex aspect-[4/3] items-center justify-center border border-line bg-paper-2 text-xs text-muted sm:w-56 sm:shrink-0">
                photo
              </div>
              <div className="min-w-0">
                <span className="inline-block bg-accent px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink">
                  Grand récit
                </span>
                <h2 className="mt-2 font-display text-xl font-bold leading-snug">
                  <Link href="/magazine/les-agudas" className="hover:text-primary">
                    Les Agudas : ces Afro-Brésiliens revenus au Bénin il y a deux siècles
                  </Link>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  Bien avant la loi sur la nationalité, d&apos;anciens captifs et leurs descendants
                  sont revenus du Brésil s&apos;installer à Ouidah et Porto-Novo. Leur histoire
                  prouve que le retour aux racines n&apos;est pas une utopie : c&apos;est déjà
                  arrivé, et le Bénin en garde les maisons, les noms et les fêtes.
                </p>
                <Link href="/magazine/les-agudas" className="mt-3 inline-block whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline">
                  Lire le récit →
                </Link>
              </div>
            </section>

            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { t: "Itinéraires mémoriels", d: "2 parcours guidés : la Route de l'Esclave, les royaumes du Sud.", i: Compass },
                { t: "Bibliothèque culturelle", d: "Livres, films, archives et articles pour comprendre l'histoire.", i: LibraryBig },
                { t: "Guides pratiques", d: "Généalogie, visa, programme afro-descendants : 4 guides pas à pas.", i: BookOpen },
              ].map((b) => (
                <article key={b.t} className="border border-line p-5">
                  <b.i aria-hidden className="h-7 w-7 text-primary" strokeWidth={2.2} />
                  <h2 className="mt-2 font-display text-lg font-bold">{b.t}</h2>
                  <p className="mt-1 text-sm text-ink-2">{b.d}</p>
                  <Link href="#" className="mt-3 inline-block whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline">Explorer →</Link>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">Retrouver ses <em>racines</em></h3>
              <p className="mt-2 text-sm text-ink-2">Généalogistes, historiens et juristes vérifiés vous accompagnent (contact par relais).</p>
              <button className="mt-3 rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">Être accompagné</button>
            </div>
            <AdSlot label="pavé latéral" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

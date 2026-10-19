import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, SectionTitle, AdSlot, PageBanner, LangSwitch } from "@/components/site/chrome";
import { ContentList } from "@/components/site/content";
import { listContents } from "@/lib/content";

export const metadata: Metadata = { title: "Mémoire & racines" };

/* Mémoire & racines (CDC §7.11) : lieux de mémoire en base, guide factuel sur
   la nationalité des afrodescendants (démarches sur le portail officiel). */

const ETAPES = [
  { t: "Vérifier son éligibilité", d: "Avoir un ascendant subsaharien déporté hors d'Afrique dans le cadre de la traite." },
  { t: "Constituer le dossier", d: "Preuves d'ascendance acceptées par l'administration béninoise (actes, généalogie documentée, tests reconnus)." },
  { t: "Déposer la demande", d: "En ligne, sur le portail officiel mis en place par l'État béninois." },
  { t: "Obtenir la reconnaissance", d: "Attestation de nationalité puis pièces d'identité, selon la procédure officielle." },
];

export default async function MemoirePage() {
  const { items, total } = await listContents({ types: ["MEMORY_PLACE"], take: 12 });

  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Mémoire &"
        em="racines"
        desc="Pour les afrodescendants en quête d'origines et pour tous les Béninois : lieux de mémoire, itinéraires et repères pratiques, documentés et relus avant publication."
      >
        <LangSwitch fr="/memoire" en="/en/roots" current="fr" />
      </PageBanner>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <SectionTitle pre="Les lieux de" em="mémoire" />
              <ContentList
                items={items}
                empty={{ title: "Les lieux de mémoire sont en cours de documentation", text: "Chaque lieu sera publié avec ses sources, après relecture par la rédaction." }}
              />
              {total > items.length && <p className="mt-3 text-sm text-muted">{items.length} affichés sur {total}.</p>}
            </section>

            <section>
              <SectionTitle pre="Devenir Béninois·e : la" em="nationalité" />
              <p className="text-sm leading-relaxed text-ink-2">
                Le Bénin a adopté en 2024 une loi reconnaissant la nationalité béninoise aux personnes
                afrodescendantes dont un ancêtre a été déporté par la traite. La demande se fait en ligne,
                sur le portail officiel de l&apos;État béninois. Les informations ci-dessous sont un repère ;
                seules les démarches officielles font foi.
              </p>
              <ol className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {ETAPES.map((s, i) => (
                  <li key={s.t} className="card-soft border border-line bg-paper p-4">
                    <span aria-hidden className="font-script text-3xl leading-none text-primary">{i + 1}</span>
                    <h3 className="mt-1 font-bold leading-tight">{s.t}</h3>
                    <p className="mt-1 text-sm text-ink-2">{s.d}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">Retrouver ses <em>racines</em></h3>
              <p className="mt-2 text-sm text-ink-2">
                Un annuaire de professionnels vérifiés (généalogistes, historiens, juristes) est en préparation.
                En attendant, la rédaction répond via le formulaire de contact.
              </p>
              <Link href="/contact" className="mt-3 inline-block rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                Écrire à la rédaction
              </Link>
            </div>
            <AdSlot label="pavé latéral" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, SectionTitle, AdSlot, AlertsBox, PageBanner } from "@/components/site/chrome";
import { ContentList } from "@/components/site/content";
import { listContents } from "@/lib/content";

export const metadata: Metadata = { title: "Retour au pays" };

/* Dossier permanent « Retour au pays » (CDC §7.4) : page thématique alimentée
   par les contenus réels portant le mot-clé « retour-au-pays ». */

const KEYWORD = "retour-au-pays";

export default async function RetourPage() {
  const [articles, offres, autres] = await Promise.all([
    listContents({ types: ["ARTICLE", "MEMBER_ARTICLE"], keyword: KEYWORD, take: 6 }),
    listContents({ types: ["JOB", "INTERNSHIP"], keyword: KEYWORD, take: 6 }),
    listContents({ types: ["EVENT", "CLASSIFIED", "PLACE", "HELP_REQUEST", "DEAL"], keyword: KEYWORD, take: 6 }),
  ]);

  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Spécial"
        em="retour au pays"
        desc="Témoignages, informations pratiques et offres au Bénin : tout ce que la communauté publie pour préparer un retour."
      >
        <Link href="/publier" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
          Raconter mon retour
        </Link>
        <Link href="/emploi" className="whitespace-nowrap rounded border-2 border-white/60 px-4 py-2 text-sm font-bold text-white hover:border-accent hover:text-accent">
          Voir les offres d&apos;emploi
        </Link>
      </PageBanner>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <SectionTitle pre="Témoignages &" em="articles" href={articles.total > articles.items.length ? `/magazine?mot=${KEYWORD}` : undefined} />
              <ContentList
                items={articles.items}
                empty={{ title: "Aucun témoignage publié pour l'instant", text: "Vous êtes rentré·e au Bénin ou préparez votre retour ? Racontez votre parcours : il sera relu puis publié ici.", href: "/publier", cta: "Raconter mon retour" }}
              />
            </section>

            <section>
              <SectionTitle pre="Travailler" em="au Bénin" href="/emploi" />
              <ContentList
                items={offres.items}
                cols={2}
                empty={{ title: "Aucune offre liée au retour pour l'instant", text: "Les offres d'emploi et de stage portant le mot-clé « retour au pays » apparaîtront ici. Toutes les offres sont dans la rubrique Emploi.", href: "/emploi", cta: "Voir toutes les offres" }}
              />
            </section>

            {autres.items.length > 0 && (
              <section>
                <SectionTitle pre="Agenda, adresses &" em="annonces" href={`/mot/${KEYWORD}`} />
                <ContentList items={autres.items} empty={{ title: "", text: "" }} />
              </section>
            )}
          </div>

          <aside className="space-y-8">
            <AlertsBox keywords={["Retour au pays"]} />
            <div className="border border-line bg-paper-2 p-4">
              <h3 className="section-title text-sm">Le HCBE vous <em>accompagne</em></h3>
              <p className="mt-2 text-sm text-ink-2">
                Pour toute question sur votre retour, le HCBE vous oriente vers les services compétents.
              </p>
              <Link href="/hcbe" className="mt-3 inline-block whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline">
                Le HCBE →
              </Link>
            </div>
            <AdSlot slot="SIDE" section="retour-au-pays" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

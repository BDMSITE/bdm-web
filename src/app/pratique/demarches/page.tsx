import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, AlertsBox, PageBanner, SectionTitle } from "@/components/site/chrome";
import { ContentList, EmptyState } from "@/components/site/content";
import { db } from "@/lib/db";
import { listContents } from "@/lib/content";
import { FileText, IdCard, Landmark, Banknote, Plane } from "lucide-react";

export const metadata: Metadata = {
  title: "Guides de démarches",
  description: "Passeport, carte consulaire, double nationalité, transfert de fonds, rapatriement : les démarches des Béninois de l'extérieur expliquées pas à pas, mises à jour par le HCBE.",
};

/* Guides de démarches : les articles portant le mot-clé « Démarches » (rédigés et tenus à
   jour par l'équipe), regroupés par thème. Aucun contenu inventé : la page montre les guides
   réellement publiés et annonce honnêtement ceux qui restent à écrire. */

export const revalidate = 900;

const KEYWORD = "demarches";

const THEMES = [
  { icon: IdCard, t: "Passeport et pièces d'identité", d: "Renouvellement, première demande, délais, documents à fournir." },
  { icon: FileText, t: "Carte consulaire et état civil", d: "Immatriculation, actes de naissance, mariage, procurations." },
  { icon: Landmark, t: "Nationalité", d: "Double nationalité, réintégration, nationalité des enfants nés à l'étranger." },
  { icon: Banknote, t: "Argent et investissement", d: "Transfert de fonds, ouverture de compte, achat de terrain, création d'entreprise." },
  { icon: Plane, t: "Retour et rapatriement", d: "Déménagement, douane, véhicule, rapatriement de corps, retour définitif." },
];

export default async function DemarchesPage() {
  const [keyword, guides] = await Promise.all([
    db.keyword.findUnique({ where: { slug: KEYWORD }, select: { name: true } }),
    listContents({ types: ["ARTICLE", "MEMBER_ARTICLE"], keyword: KEYWORD, take: 30 }),
  ]);

  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Guides de"
        em="démarches"
        desc="Les démarches des Béninois de l'extérieur, expliquées pas à pas : ce qu'il faut, où aller, combien de temps. Rédigés et mis à jour par le HCBE, avec une alerte à chaque mise à jour."
      >
        <Link href="/compte/alertes" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
          Être alerté des mises à jour
        </Link>
      </PageBanner>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <SectionTitle pre="Les" em="thèmes" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {THEMES.map((th) => (
                  <article key={th.t} className="border border-line p-4">
                    <th.icon aria-hidden className="h-7 w-7 text-primary" strokeWidth={2.2} />
                    <h3 className="mt-2 font-bold">{th.t}</h3>
                    <p className="mt-1 text-sm text-ink-2">{th.d}</p>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <SectionTitle pre="Les guides" em={`publiés (${guides.total})`} />
              {guides.items.length === 0 ? (
                <EmptyState
                  title="Les premiers guides arrivent"
                  text="Le HCBE rédige les guides thème par thème. Une question urgente sur une démarche ? Posez-la via le formulaire de contact, la réponse alimentera le guide."
                  href="/contact?sujet=Question%20au%20HCBE"
                  cta="Poser ma question"
                />
              ) : (
                <ContentList items={guides.items} cols={2} empty={{ title: "", text: "" }} />
              )}
              {!keyword && <p className="mt-3 text-xs text-muted">Pour l&apos;équipe : les guides sont les articles portant le mot-clé « Démarches ».</p>}
            </section>
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary p-4 text-sm">
              <h3 className="section-title text-sm">Démarches <em>officielles</em></h3>
              <p className="mt-2 text-ink-2">Les guides expliquent et orientent ; les actes eux-mêmes se font auprès de l&apos;ambassade ou du consulat du Bénin de votre pays de résidence.</p>
              <Link href="/pays" className="mt-3 inline-block text-sm font-bold uppercase text-primary hover:underline">Votre pays →</Link>
            </div>
            <AlertsBox keywords={["Démarches"]} />
            <AdSlot slot="SIDE" section="pratique" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

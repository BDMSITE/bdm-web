import Link from "next/link";
import { SiteHeader, SiteFooter, SectionTitle, AdSlot, AlertsBox } from "@/components/site/chrome";
import { PartnersBand } from "@/components/site/partners-band";
import { ContentCard, EmptyState } from "@/components/site/content";
import { listContents, listProfiles, siteCounts } from "@/lib/content";
import { profileHref } from "@/lib/routes";

/* Accueil (CDC §7.2) — chaque section lit la base ; une section vide le dit. */

export default async function Home() {
  const [une, articles, offres, adresses, bonsPlans, agenda, counts, experts] = await Promise.all([
    listContents({ types: ["ARTICLE", "MEMBER_ARTICLE"], featured: true, take: 3 }),
    listContents({ types: ["ARTICLE", "MEMBER_ARTICLE"], take: 4 }),
    listContents({ types: ["JOB", "INTERNSHIP"], take: 4 }),
    listContents({ types: ["PLACE"], take: 3 }),
    listContents({ types: ["DEAL"], take: 4 }),
    listContents({ types: ["EVENT"], upcoming: true, take: 3 }),
    siteCounts(),
    listProfiles({ keyword: "competences-de-la-diaspora", take: 3 }),
  ]);
  const aLaUne = une.items.length ? une.items : articles.items.slice(0, 3);

  return (
    <>
      <SiteHeader mapDefaultOpen />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-12">
            <section>
              <SectionTitle pre="À la" em="une" href="/magazine" />
              {aLaUne.length === 0 ? (
                <EmptyState title="Les premiers articles arrivent" text="La rédaction prépare les premiers contenus du magazine." href="/publier" cta="Proposer un article" />
              ) : (
                <div className="grid gap-5 md:grid-cols-3">
                  {aLaUne.map((a) => <ContentCard key={a.id} item={a} />)}
                </div>
              )}
            </section>

            <section>
              <SectionTitle pre="Offres" em="emploi & stages" href="/emploi" />
              {offres.items.length === 0 ? (
                <EmptyState title="Aucune offre pour l'instant" text="Les offres d'emploi et de stage apparaîtront ici dès qu'un recruteur en publiera." href="/publier" cta="Déposer une offre" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {offres.items.map((o) => <ContentCard key={o.id} item={o} compact />)}
                </div>
              )}
            </section>

            {articles.items.length > 0 && (
              <section>
                <SectionTitle pre="Les derniers" em="articles" href="/magazine" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {articles.items.map((a) => <ContentCard key={a.id} item={a} compact />)}
                </div>
              </section>
            )}

            <AdSlot slot="MID" section="accueil" />

            <section>
              <SectionTitle pre="Bonnes" em="adresses" href="/adresses" />
              {adresses.items.length === 0 ? (
                <EmptyState title="Aucune adresse référencée" text="Restaurants, commerces et services béninois dans le monde : proposez la vôtre." href="/publier" cta="Proposer une adresse" />
              ) : (
                <div className="grid gap-5 sm:grid-cols-3">
                  {adresses.items.map((a) => <ContentCard key={a.id} item={a} />)}
                </div>
              )}
            </section>

            {bonsPlans.items.length > 0 && (
              <section>
                <SectionTitle pre="Bons plans &" em="réductions" href="/bons-plans" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {bonsPlans.items.map((a) => <ContentCard key={a.id} item={a} compact />)}
                </div>
              </section>
            )}

            <section>
              <SectionTitle pre="Compétences de la" em="diaspora" href="/communaute/competences" />
              {experts.items.length === 0 ? (
                <EmptyState title="Les premiers profils experts arrivent" text="Le HCBE met en relation les expertises de la diaspora avec les projets du Bénin. Signalez vos compétences depuis votre profil." href="/compte/profil" cta="Compléter mon profil" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  {experts.items.map((p) => (
                    <article key={p.id} className="card-soft border border-line bg-paper p-4">
                      <p className="font-bold leading-tight"><Link href={profileHref(p.slug)} className="hover:text-primary">{p.displayName}</Link></p>
                      {p.headline && <p className="text-sm text-ink-2">{p.headline}</p>}
                      <p className="card-location mt-1">{[p.city, p.country].filter(Boolean).join(" · ")}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionTitle pre="Événements" em="à venir" href="/agenda" />
              {agenda.items.length === 0 ? (
                <EmptyState title="Aucun événement annoncé" text="Les prochains rendez-vous de la communauté s'afficheront ici." href="/publier" cta="Annoncer un événement" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  {agenda.items.map((e) => <ContentCard key={e.id} item={e} compact />)}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-8">
            <AdSlot slot="SIDE" section="accueil" />
            <AlertsBox />
            <div className="border border-line bg-paper-2 p-4 text-sm">
              <p className="font-display text-lg font-bold">Le réseau aujourd&apos;hui</p>
              <p className="mt-1 text-ink-2">
                <strong className="text-ink">{counts.members.toLocaleString("fr-FR")}</strong> membre{counts.members > 1 ? "s" : ""} dans l&apos;annuaire
                {counts.countries > 0 && <> · <strong className="text-ink">{counts.countries}</strong> pays</>}
              </p>
              <Link href="/inscription" className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                Rejoindre gratuitement
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <PartnersBand />

      <SiteFooter />
    </>
  );
}

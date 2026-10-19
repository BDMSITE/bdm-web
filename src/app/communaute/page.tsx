import Link from "next/link";
import type { Metadata } from "next";
import type { AccountType } from "@prisma/client";
import { SiteHeader, SiteFooter, SectionTitle, AdSlot, PageBanner } from "@/components/site/chrome";
import { ContentList } from "@/components/site/content";
import { db } from "@/lib/db";
import { listContents, publicProfileWhere } from "@/lib/content";
import { profileHref } from "@/lib/routes";

export const metadata: Metadata = { title: "Communauté" };

/* Accueil communauté (CDC §7.5) : quatre annuaires, compteurs réels et
   derniers inscrits en base. Jamais de nom ni de chiffre inventé. */

const TYPES: { type: AccountType; pre: string; em: string; href: string; cta: string }[] = [
  { type: "MEMBER", pre: "Membres", em: "", href: "/communaute/membres", cta: "Tout l'annuaire" },
  { type: "COMPANY", pre: "Entreprises", em: "", href: "/communaute/entreprises", cta: "Toutes les entreprises" },
  { type: "ASSOCIATION", pre: "Associations", em: "", href: "/communaute/associations", cta: "Toutes les associations" },
  { type: "ARTIST", pre: "Artistes &", em: "groupes", href: "/communaute/artistes", cta: "Tous les artistes" },
];

export default async function CommunautePage() {
  const [tuiles, publies] = await Promise.all([
    Promise.all(
      TYPES.map(async (t) => {
        const where = publicProfileWhere({ user: { status: "ACTIVE", accountType: t.type } });
        const [n, derniers] = await Promise.all([
          db.profile.count({ where }),
          db.profile.findMany({ where, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, slug: true, displayName: true, city: true, country: true } }),
        ]);
        return { ...t, n, derniers };
      }),
    ),
    listContents({ types: ["MEMBER_ARTICLE", "EVENT", "JOB", "INTERNSHIP", "CLASSIFIED", "HELP_REQUEST"], take: 3 }),
  ]);

  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="La"
        em="communauté"
        desc="Membres, entreprises, associations, artistes : quatre annuaires alimentés par les inscrits eux-mêmes. Inscription gratuite, publication après relecture."
      >
        <Link href="/inscription" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
          Créer mon profil gratuit
        </Link>
      </PageBanner>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <div className="grid gap-4 sm:grid-cols-2">
              {tuiles.map((t) => (
                <section key={t.type} className="flex flex-col border border-line p-5">
                  <div className="flex items-baseline justify-between border-b-2 border-line pb-2">
                    <h2 className="section-title text-base">
                      {t.pre} {t.em && <em>{t.em}</em>}
                    </h2>
                    <span className="font-display text-2xl font-black text-primary">{t.n.toLocaleString("fr-FR")}</span>
                  </div>
                  {t.derniers.length === 0 ? (
                    <p className="mt-3 text-sm text-muted">Aucune fiche publiée pour l&apos;instant.</p>
                  ) : (
                    <ul className="mt-3 space-y-2 text-sm">
                      {t.derniers.map((p) => (
                        <li key={p.id} className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary-dark">
                            {p.displayName[0]}
                          </span>
                          <Link href={profileHref(p.slug)} className="min-w-0 truncate font-semibold hover:text-primary">{p.displayName}</Link>
                          <span className="ml-auto shrink-0 text-xs text-muted">{[p.city, p.country].filter(Boolean).join(" · ")}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href={t.href} className="mt-auto inline-block pt-4 text-sm font-bold uppercase text-primary hover:underline">
                    {t.cta} →
                  </Link>
                </section>
              ))}
            </div>

            <section>
              <SectionTitle pre="Publié par la" em="communauté" href="/magazine" />
              <ContentList
                items={publies.items}
                empty={{ title: "Rien de publié par la communauté pour l'instant", text: "Les articles, événements, offres et annonces déposés par les membres apparaîtront ici après relecture.", href: "/publier", cta: "Publier un contenu" }}
              />
            </section>
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary bg-primary-faint p-4 text-center">
              <p className="font-display text-lg font-bold">Inscrivez-vous, publiez</p>
              <p className="mt-1 text-sm text-ink-2">Profil gratuit, visible dans l&apos;annuaire, publication de vos contenus après relecture.</p>
              <Link href="/inscription" className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                Je m&apos;inscris
              </Link>
            </div>
            <div className="border border-line bg-paper-2 p-4">
              <h3 className="section-title text-sm">Compétences de la <em>diaspora</em></h3>
              <p className="mt-2 text-sm text-ink-2">L&apos;initiative du HCBE pour mobiliser les expertises de l&apos;extérieur au service de projets au Bénin.</p>
              <Link href="/communaute/competences" className="mt-3 inline-block whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline">
                En savoir plus →
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

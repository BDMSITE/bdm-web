import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ContentType } from "@prisma/client";
import { SiteHeader, SiteFooter, AdSlot, AlertsBox, PageBanner, SectionTitle } from "@/components/site/chrome";
import { ContentList } from "@/components/site/content";
import { db } from "@/lib/db";
import { listContents, listProfiles } from "@/lib/content";
import { profileHref } from "@/lib/routes";

/* Page mot-clé (CDC §7.1) : tout ce qui porte ce mot-clé en base,
   contenus publiés et membres de l'annuaire. États vides honnêtes. */

const ALL_TYPES: ContentType[] = ["ARTICLE", "MEMBER_ARTICLE", "JOB", "INTERNSHIP", "EVENT", "CLASSIFIED", "PLACE", "DEAL", "HELP_REQUEST", "MEMORY_PLACE"];

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const kw = await db.keyword.findUnique({ where: { slug }, select: { name: true } });
  return { title: kw ? `Mot-clé : ${kw.name}` : "Mot-clé introuvable" };
}

export default async function MotClePage({ params }: Props) {
  const { slug } = await params;
  const keyword = await db.keyword.findUnique({ where: { slug }, include: { parent: true, children: true } });
  if (!keyword) notFound();

  const [contents, profiles] = await Promise.all([
    listContents({ types: ALL_TYPES, keyword: slug, take: 30 }),
    listProfiles({ keyword: slug, take: 12 }),
  ]);
  const proches = [keyword.parent, ...keyword.children].filter((k): k is NonNullable<typeof k> => Boolean(k));

  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Mot-clé :"
        em={keyword.name}
        desc="Tous les contenus et membres liés à ce mot-clé. Créez une alerte pour recevoir chaque nouveauté par e-mail."
      >
        <Link href="/compte/alertes" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
          Créer une alerte sur ce mot-clé
        </Link>
      </PageBanner>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <SectionTitle pre="Contenus" em={`(${contents.total})`} />
              <ContentList
                items={contents.items}
                empty={{ title: "Aucun contenu publié avec ce mot-clé", text: "Les articles, offres, événements et adresses portant ce mot-clé apparaîtront ici.", href: "/publier", cta: "Publier un contenu" }}
              />
              {contents.total > contents.items.length && (
                <p className="mt-4 text-center text-sm text-muted">{contents.items.length} affichés sur {contents.total}.</p>
              )}
            </section>

            <section>
              <SectionTitle pre="Membres" em={`(${profiles.total})`} href={profiles.total > 0 ? `/communaute/membres?q=${encodeURIComponent(keyword.name)}` : undefined} />
              {profiles.items.length === 0 ? (
                <p className="border border-dashed border-line bg-paper-2 p-6 text-center text-sm text-ink-2">
                  Aucun membre de l&apos;annuaire ne porte ce mot-clé pour l&apos;instant.
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {profiles.items.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 border border-line p-3 hover:border-primary hover:bg-primary-faint">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light font-display font-bold text-primary-dark">
                        {m.displayName[0]}
                      </span>
                      <div className="min-w-0">
                        <Link href={profileHref(m.slug)} className="font-bold leading-tight hover:text-primary">{m.displayName}</Link>
                        <p className="card-location mt-0.5">{[m.city, m.country].filter(Boolean).join(" · ")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-8">
            <AlertsBox keywords={[keyword.name]} />
            {proches.length > 0 && (
              <div className="border-2 border-primary p-4">
                <h3 className="section-title text-sm">Mots-clés <em>proches</em></h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {proches.map((k) => (
                    <Link key={k.id} href={`/mot/${k.slug}`} className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark hover:bg-primary hover:text-white">
                      {k.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <AdSlot label="pavé latéral" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

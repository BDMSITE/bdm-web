import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, PageBanner } from "@/components/site/chrome";
import { EmptyState } from "@/components/site/content";
import { db } from "@/lib/db";
import { listProfiles, publicProfileWhere } from "@/lib/content";
import { profileHref } from "@/lib/routes";

export const metadata: Metadata = { title: "Artistes & groupes" };

/* Annuaire des artistes et groupes (CDC §7.5) : comptes ARTIST actifs et visibles
   dans l'annuaire. Filtres GET (q, pays), compteur réel, état vide honnête. */

const SECTION = "/communaute/artistes";
const SELECT = "rounded border border-line bg-paper px-3 py-2 text-sm";

type Props = { searchParams: Promise<{ q?: string; pays?: string }> };

export default async function ArtistesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const pays = sp.pays?.trim() ?? "";
  const filtre = Boolean(q || pays);

  const [{ items, total }, countries] = await Promise.all([
    listProfiles({ accountType: "ARTIST", q, country: pays, take: 30 }),
    db.profile.findMany({
      where: publicProfileWhere({ user: { status: "ACTIVE", accountType: "ARTIST" }, country: { not: null } }),
      distinct: ["country"],
      select: { country: true },
      orderBy: { country: "asc" },
    }),
  ]);

  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Artistes &"
        em="groupes"
        desc="Musiciens, danseurs, plasticiens, comédiens, groupes : les artistes béninois et d'origine béninoise inscrits sur le site présentent leur travail et annoncent leurs dates."
      >
        <Link href="/inscription" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
          Créer ma fiche artiste
        </Link>
        <Link href="/agenda" className="whitespace-nowrap rounded border-2 border-white/60 px-4 py-2 text-sm font-bold text-white hover:border-accent hover:text-accent">
          Voir l&apos;agenda
        </Link>
      </PageBanner>

      <form action={SECTION} className="border-b border-line bg-paper-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          <input type="search" name="q" defaultValue={q} placeholder="Nom, discipline, ville…" className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none sm:w-64" />
          {countries.length > 0 && (
            <select name="pays" defaultValue={pays} aria-label="Pays" className={SELECT}>
              <option value="">Tous les pays</option>
              {countries.map((c) => <option key={c.country!} value={c.country!}>{c.country}</option>)}
            </select>
          )}
          <button className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">Rechercher</button>
          <Link href="/" className="ml-auto whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline">Voir sur la carte</Link>
        </div>
      </form>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <p className="mb-5 text-sm text-muted">
              <strong className="text-ink">{total}</strong> artiste{total > 1 ? "s" : ""} / groupe{total > 1 ? "s" : ""}
              {filtre && <> — <Link href={SECTION} className="font-bold text-primary hover:underline">tout afficher</Link></>}
            </p>

            {items.length === 0 ? (
              <EmptyState
                title={filtre ? "Aucun artiste ne correspond à ces critères" : "Aucun artiste inscrit pour l'instant"}
                text={filtre ? "Essayez d'autres mots ou retirez un filtre." : "Les fiches apparaissent ici dès que le compte artiste est validé. Vous êtes artiste ou membre d'un groupe ? Créez votre fiche gratuitement."}
                href={filtre ? SECTION : "/inscription"}
                cta={filtre ? "Tout afficher" : "Créer ma fiche artiste"}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((a) => {
                  const sectors = a.keywords.filter((k) => k.keyword.family === "SECTOR").map((k) => k.keyword.name);
                  return (
                    <article key={a.id} className="flex h-full flex-col border border-line p-4 hover:border-primary hover:bg-primary-faint">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-light font-display font-bold text-primary-dark">
                          {a.displayName[0]}
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-bold leading-tight">
                            <Link href={profileHref(a.slug)} className="hover:text-primary">{a.displayName}</Link>
                          </h2>
                          {(a.artist?.discipline || a.headline) && <p className="truncate text-sm text-ink-2">{a.artist?.discipline ?? a.headline}</p>}
                          <p className="card-location mt-0.5">{[a.city, a.country].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                      {sectors.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {sectors.map((s) => (
                            <span key={s} className="rounded-full border border-line bg-paper-2 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-2">{s}</span>
                          ))}
                        </div>
                      )}
                      {a.publishedCount > 0 && (
                        <p className="mt-auto pt-2 text-xs text-muted">{a.publishedCount} contenu{a.publishedCount > 1 ? "s" : ""} publié{a.publishedCount > 1 ? "s" : ""}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
            {total > items.length && <p className="mt-6 text-center text-sm text-muted">{items.length} affichés sur {total} — affinez avec les filtres.</p>}
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary bg-primary-faint p-4 text-center">
              <p className="font-display text-lg font-bold">Une date à annoncer ?</p>
              <p className="mt-1 text-sm text-ink-2">Concert, exposition, spectacle : publiez-la dans l&apos;agenda.</p>
              <Link href="/publier" className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                Publier un événement
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

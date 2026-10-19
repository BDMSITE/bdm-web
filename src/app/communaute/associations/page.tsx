import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, PageBanner } from "@/components/site/chrome";
import { EmptyState } from "@/components/site/content";
import { db } from "@/lib/db";
import { listProfiles, publicProfileWhere } from "@/lib/content";
import { profileHref } from "@/lib/routes";

export const metadata: Metadata = { title: "Annuaire des associations" };

/* Annuaire des associations (CDC §7.5) : comptes ASSOCIATION actifs et visibles
   dans l'annuaire. Filtres GET (q, pays), compteur réel, état vide honnête. */

const SECTION = "/communaute/associations";
const SELECT = "rounded border border-line bg-paper px-3 py-2 text-sm";

type Props = { searchParams: Promise<{ q?: string; pays?: string }> };

export default async function AssociationsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const pays = sp.pays?.trim() ?? "";
  const filtre = Boolean(q || pays);

  const [{ items, total }, countries] = await Promise.all([
    listProfiles({ accountType: "ASSOCIATION", q, country: pays, take: 30 }),
    db.profile.findMany({
      where: publicProfileWhere({ user: { status: "ACTIVE", accountType: "ASSOCIATION" }, country: { not: null } }),
      distinct: ["country"],
      select: { country: true },
      orderBy: { country: "asc" },
    }),
  ]);

  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Toutes les"
        em="associations"
        desc="Les associations béninoises actives dans le monde : culturelles, étudiantes, sportives, humanitaires. Chaque association gère sa fiche et publie ses événements."
      >
        <Link href="/inscription" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
          Référencer mon association
        </Link>
      </PageBanner>

      <form action={SECTION} className="border-b border-line bg-paper-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          <input type="search" name="q" defaultValue={q} placeholder="Nom, objet, ville…" className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none sm:w-64" />
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
              <strong className="text-ink">{total}</strong> association{total > 1 ? "s" : ""}
              {filtre && <> — <Link href={SECTION} className="font-bold text-primary hover:underline">tout afficher</Link></>}
            </p>

            {items.length === 0 ? (
              <EmptyState
                title={filtre ? "Aucune association ne correspond à ces critères" : "Aucune association référencée pour l'instant"}
                text={filtre ? "Essayez d'autres mots ou retirez un filtre." : "Les associations apparaissent ici dès que leur compte est validé. Vous animez une association béninoise ? Référencez-la gratuitement."}
                href={filtre ? SECTION : "/inscription"}
                cta={filtre ? "Tout afficher" : "Référencer mon association"}
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
                          {a.headline && <p className="truncate text-sm text-ink-2">{a.headline}</p>}
                          <p className="card-location mt-0.5">{[a.city, a.country].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                      {a.association?.purpose && <p className="mt-3 line-clamp-2 text-sm text-ink-2">{a.association.purpose}</p>}
                      {sectors.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {sectors.map((s) => (
                            <span key={s} className="rounded-full border border-line bg-paper-2 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-2">{s}</span>
                          ))}
                        </div>
                      )}
                      <p className="mt-auto pt-2 text-xs text-muted">
                        {[
                          a.association?.foundedYear ? `Depuis ${a.association.foundedYear}` : null,
                          a.publishedCount > 0 ? `${a.publishedCount} contenu${a.publishedCount > 1 ? "s" : ""} publié${a.publishedCount > 1 ? "s" : ""}` : null,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
            {total > items.length && <p className="mt-6 text-center text-sm text-muted">{items.length} affichées sur {total} — affinez avec les filtres.</p>}
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary bg-primary-faint p-4 text-center">
              <p className="font-display text-lg font-bold">Votre association a un événement ?</p>
              <p className="mt-1 text-sm text-ink-2">Publiez-le dans l&apos;agenda : il sera relu puis mis en ligne.</p>
              <Link href="/publier" className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                Publier un événement
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

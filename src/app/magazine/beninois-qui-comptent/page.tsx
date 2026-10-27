import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, PageBanner } from "@/components/site/chrome";
import { EmptyState } from "@/components/site/content";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Béninois qui comptent" };

/* Béninois qui comptent (CDC §7.4) : personnalités de la table Celebrity,
   rédigées et validées par la rédaction. État vide tant que la liste se constitue. */

type Props = { searchParams: Promise<{ q?: string; domaine?: string }> };

export default async function CelebritesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const domaine = sp.domaine?.trim() ?? "";
  const filtre = Boolean(q || domaine);

  const where = {
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { bio: { contains: q, mode: "insensitive" as const } }] }),
    ...(domaine && { domain: domaine }),
  };
  const [items, total, domaines] = await Promise.all([
    db.celebrity.findMany({ where, orderBy: { name: "asc" }, take: 60 }),
    db.celebrity.count({ where }),
    db.celebrity.findMany({ where: { domain: { not: null } }, distinct: ["domain"], select: { domain: true }, orderBy: { domain: "asc" } }),
  ]);

  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Béninois qui"
        em="comptent"
        desc="Musique, sport, sciences, business, politique : les personnalités béninoises et d'origine béninoise qui font rayonner le pays. Fiches rédigées et validées par la rédaction."
      />

      <form action="/magazine/beninois-qui-comptent" className="border-b border-line bg-paper-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          <input type="search" name="q" defaultValue={q} placeholder="Nom…" className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none sm:w-64" />
          {domaines.length > 0 && (
            <select name="domaine" defaultValue={domaine} aria-label="Domaine" className="rounded border border-line bg-paper px-3 py-2 text-sm">
              <option value="">Tous les domaines</option>
              {domaines.map((d) => <option key={d.domain!} value={d.domain!}>{d.domain}</option>)}
            </select>
          )}
          <button className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">Rechercher</button>
        </div>
      </form>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <p className="mb-5 text-sm text-muted">
              <strong className="text-ink">{total}</strong> fiche{total > 1 ? "s" : ""}
              {filtre && <> — <Link href="/magazine/beninois-qui-comptent" className="font-bold text-primary hover:underline">tout afficher</Link></>}
            </p>

            {items.length === 0 ? (
              <EmptyState
                title={filtre ? "Aucune personnalité ne correspond à ces critères" : "Liste en cours de constitution"}
                text={filtre ? "Essayez un autre nom ou retirez le filtre." : "La rédaction prépare les premières fiches. Une personnalité fait rayonner le Bénin et mérite d'y figurer ? Proposez-la."}
                href={filtre ? "/magazine/beninois-qui-comptent" : "/contact"}
                cta={filtre ? "Tout afficher" : "Proposer une personnalité"}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((p) => (
                  <article key={p.id} className="border border-line hover:border-primary">
                    {p.photo ? (
                      <div className="relative aspect-square bg-paper-2">
                        <Image src={p.photo} alt={p.name} fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-paper-2 font-display text-5xl font-black text-line">{p.name[0]}</div>
                    )}
                    <div className="p-4">
                      {p.domain && <span className="text-[0.7rem] font-bold uppercase tracking-wider text-primary">{p.domain}</span>}
                      <h2 className="mt-1 font-display text-lg font-bold leading-tight">{p.name}</h2>
                      {p.bio && <p className="mt-1 line-clamp-4 text-sm text-ink-2">{p.bio}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
            {total > items.length && <p className="mt-6 text-center text-sm text-muted">{items.length} affichées sur {total} — affinez avec la recherche.</p>}
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">Proposer une <em>personnalité</em></h3>
              <p className="mt-2 text-sm text-ink-2">
                Un Béninois fait rayonner le pays et manque à la liste ? Écrivez à la rédaction : elle vérifie, rédige et publie.
              </p>
              <Link href="/contact" className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                Proposer
              </Link>
            </div>
            <AdSlot slot="SIDE" section="magazine" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

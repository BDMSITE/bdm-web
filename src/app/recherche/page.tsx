import Link from "next/link";
import type { Metadata } from "next";
import type { ContentType } from "@prisma/client";
import { SiteHeader, SiteFooter, AdSlot } from "@/components/site/chrome";
import { search } from "@/lib/search";
import { CONTENT_LABEL, contentHref, profileHref } from "@/lib/routes";

export const metadata: Metadata = { title: "Recherche" };

/* Recherche globale (CDC §7.15) : facettes par type + membres.
   Meilisearch si disponible, sinon Postgres (voir src/lib/search.ts). */

type Props = { searchParams: Promise<{ q?: string; type?: string }> };

export default async function RecherchePage({ searchParams }: Props) {
  const { q = "", type } = await searchParams;
  const query = q.trim();
  const typeParam = type === "PROFILE" ? "PROFILE" : type && type in CONTENT_LABEL ? (type as ContentType) : undefined;

  const r = query ? await search(query, typeParam) : null;
  const total = r ? r.contents.total + r.profiles.total : 0;
  const href = (t?: string) => `/recherche?q=${encodeURIComponent(query)}${t ? `&type=${t}` : ""}`;

  const chips = r
    ? [
        { label: `Tout (${Object.values(r.contents.facets).reduce((a, b) => a + b, 0) + (typeParam ? 0 : r.profiles.total)})`, href: href(), active: !typeParam },
        ...Object.entries(r.contents.facets).map(([t, n]) => ({ label: `${CONTENT_LABEL[t as ContentType] ?? t}s (${n})`, href: href(t), active: typeParam === t })),
        ...(r.profiles.total || typeParam === "PROFILE" ? [{ label: `Membres (${r.profiles.total})`, href: href("PROFILE"), active: typeParam === "PROFILE" }] : []),
      ]
    : [];

  return (
    <>
      <SiteHeader />
      <div className="wax-bg bg-primary-darker py-10 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="section-title text-2xl">Rechercher <em className="!text-accent">partout</em></h1>
          <form action="/recherche" className="mt-4 flex max-w-2xl gap-2">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Un métier, une ville, un nom…"
              autoFocus={!query}
              className="w-full rounded border-2 border-white/30 bg-white px-4 py-3 text-base text-ink focus:border-accent focus:outline-none"
            />
            <button className="rounded bg-accent px-6 py-3 text-sm font-bold uppercase text-ink hover:bg-accent-dark">OK</button>
          </form>
          <p className="mt-2 text-xs text-white/60">Articles, offres, membres, associations, adresses, événements, annonces, lieux de mémoire…</p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            {!r && <p className="text-sm text-muted">Saisissez un mot pour lancer la recherche.</p>}

            {r && (
              <>
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  {chips.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      className={
                        c.active
                          ? "whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-bold text-white"
                          : "whitespace-nowrap rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-2 hover:border-primary hover:text-primary"
                      }
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>

                {total === 0 && (
                  <p className="text-sm text-muted">Aucun résultat pour « {query} ». Essayez un autre mot ou une ville.</p>
                )}

                <ul className="divide-y divide-line border border-line empty:hidden">
                  {r.profiles.hits.map((p) => (
                    <li key={p.id} className="flex items-center gap-4 p-4 hover:bg-primary-faint">
                      <span className="shrink-0 whitespace-nowrap rounded bg-accent-light px-2 py-1 text-xs font-bold uppercase text-ink">Membre</span>
                      <p className="min-w-0 flex-1 font-bold leading-snug">
                        <Link href={profileHref(p.slug)} className="hover:text-primary">{p.displayName}</Link>
                        <span className="card-location ml-2">{[p.city, p.country].filter(Boolean).join(" · ")}</span>
                      </p>
                    </li>
                  ))}
                  {r.contents.hits.map((c) => (
                    <li key={c.id} className="flex items-center gap-4 p-4 hover:bg-primary-faint">
                      <span className="shrink-0 whitespace-nowrap rounded bg-primary-light px-2 py-1 text-xs font-bold uppercase text-primary-dark">
                        {CONTENT_LABEL[c.type]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold leading-snug">
                          <Link href={contentHref(c.type)} className="hover:text-primary">{c.title}</Link>
                        </p>
                        {c.excerpt && <p className="mt-0.5 line-clamp-1 text-sm text-ink-2">{c.excerpt}</p>}
                        <p className="card-location mt-1">{[c.city, c.country].filter(Boolean).join(" · ")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-3 text-xs text-muted">
              {r?.engine === "meilisearch"
                ? "Recherche propulsée par Meilisearch : tolérance aux fautes et résultats instantanés."
                : "Recherche sur la base de données du site."}
            </p>
          </div>
          <aside className="space-y-8"><AdSlot slot="SIDE" section="recherche" /></aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

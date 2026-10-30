import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { SiteHeader, SiteFooter, AdSlot, AlertsBox } from "@/components/site/chrome";
import { db } from "@/lib/db";
import { profileHref } from "@/lib/routes";

export const metadata: Metadata = { title: "Annuaire des membres" };

/* Annuaire des membres (CDC §7.5) — profils actifs en base, filtres
   nom / pays / secteur, index A–Z. */

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PAGE = 24;

type Props = { searchParams: Promise<{ q?: string; pays?: string; secteur?: string; lettre?: string }> };

export default async function MembresPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const pays = sp.pays?.trim() ?? "";
  const secteur = sp.secteur?.trim() ?? "";
  const lettre = sp.lettre?.toUpperCase().slice(0, 1) ?? "";

  const where: Prisma.ProfileWhereInput = {
    user: { status: "ACTIVE" },
    visibility: { path: ["directory"], equals: true },
    ...(q && {
      OR: [
        { displayName: { contains: q, mode: "insensitive" } },
        { bio: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { keywords: { some: { keyword: { name: { contains: q, mode: "insensitive" } } } } },
      ],
    }),
    ...(pays && { country: pays }),
    ...(secteur && { keywords: { some: { keyword: { slug: secteur, family: "SECTOR" } } } }),
    ...(lettre && { displayName: { startsWith: lettre, mode: "insensitive" } }),
  };

  const [membres, total, pays_, secteurs] = await Promise.all([
    db.profile.findMany({
      where,
      orderBy: { displayName: "asc" },
      take: PAGE,
      include: { user: { select: { accountType: true } }, keywords: { include: { keyword: true } } },
    }),
    db.profile.count({ where }),
    db.profile.findMany({ where: { user: { status: "ACTIVE" }, country: { not: null } }, distinct: ["country"], select: { country: true }, orderBy: { country: "asc" } }),
    db.keyword.findMany({ where: { family: "SECTOR" }, orderBy: { name: "asc" } }),
  ]);

  const qs = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ q, pays, secteur, lettre, ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    const s = p.toString();
    return `/communaute/membres${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <SiteHeader />

      <div className="wax-bg bg-primary-darker py-8 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="section-title text-2xl md:text-3xl">
            Tous les <em className="!text-accent">membres</em>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            La diaspora béninoise et les Béninois du pays, par ville et par secteur. Inscrivez-vous
            gratuitement pour apparaître dans l&apos;annuaire et publier.
          </p>
        </div>
      </div>

      <form action="/communaute/membres" className="border-b border-line bg-paper-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          <input
            type="search"
            name="q"
            aria-label="Rechercher un membre"
            defaultValue={q}
            placeholder="Nom, profession, ville…"
            className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none sm:w-64"
          />
          <select name="pays" defaultValue={pays} aria-label="Pays" className="rounded border border-line bg-paper px-3 py-2 text-sm">
            <option value="">Tous les pays</option>
            {pays_.map((p) => (
              <option key={p.country!} value={p.country!}>{p.country}</option>
            ))}
          </select>
          <select name="secteur" defaultValue={secteur} aria-label="Secteur" className="rounded border border-line bg-paper px-3 py-2 text-sm">
            <option value="">Tous les secteurs</option>
            {secteurs.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
          <button className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
            Rechercher
          </button>
          <Link href="/#carte" className="ml-auto whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline">
            Voir sur la carte
          </Link>
        </div>
      </form>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-1">
              {ALPHA.map((l) => (
                <Link
                  key={l}
                  href={qs({ lettre: lettre === l ? "" : l })}
                  aria-current={lettre === l ? "true" : undefined}
                  className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold ${
                    lettre === l ? "bg-primary text-white" : "text-ink-2 hover:bg-primary hover:text-white"
                  }`}
                >
                  {l}
                </Link>
              ))}
              <span className="ml-auto text-sm text-muted">
                <strong className="text-ink">{total.toLocaleString("fr-FR")}</strong> membre{total > 1 ? "s" : ""}
              </span>
            </div>

            {membres.length === 0 && (
              <p className="border border-line p-6 text-center text-sm text-muted">
                Aucun membre ne correspond à ces critères.{" "}
                <Link href="/communaute/membres" className="font-bold text-primary hover:underline">Réinitialiser</Link>
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {membres.map((m) => {
                const sectors = m.keywords.filter((k) => k.keyword.family === "SECTOR").map((k) => k.keyword.name);
                const afro = m.keywords.some((k) => k.keyword.slug === "afrodescendants");
                return (
                  <article key={m.id} className="border border-line p-4 hover:border-primary hover:bg-primary-faint">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-light font-display font-bold text-primary-dark">
                        {m.displayName[0]}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold leading-tight">
                          <Link href={profileHref(m.slug)} className="hover:text-primary">{m.displayName}</Link>
                        </h2>
                        {m.headline && <p className="truncate text-sm text-ink-2">{m.headline}</p>}
                        <p className="card-location mt-0.5">{[m.city, m.country].filter(Boolean).join(" · ")}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {sectors.map((s) => (
                        <span key={s} className="rounded-full border border-line bg-paper-2 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-2">{s}</span>
                      ))}
                      {m.cvPublished && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-ink">CV publié</span>
                      )}
                      {afro && (
                        <span className="rounded-full border border-primary bg-primary-faint px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-primary-dark">Afrodescendant·e</span>
                      )}
                    </div>
                    {m.publishedCount > 0 && (
                      <p className="mt-2 text-xs text-muted">
                        {m.publishedCount} contenu{m.publishedCount > 1 ? "s" : ""} publié{m.publishedCount > 1 ? "s" : ""}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>

            {total > membres.length && (
              <p className="mt-6 text-center text-sm text-muted">
                {membres.length} affichés sur {total} — affinez avec les filtres.
              </p>
            )}
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary bg-primary-faint p-4 text-center">
              <p className="font-display text-lg font-bold">Rejoindre la communauté</p>
              <p className="mt-1 text-sm text-ink-2">Inscrivez-vous et publiez directement vos articles, offres et événements.</p>
              <Link href="/inscription" className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                Je m&apos;inscris
              </Link>
            </div>
            <AlertsBox keywords={[]} />
            <AdSlot slot="SIDE" section="communaute" />
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

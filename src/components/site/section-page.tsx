import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import type { ContentType } from "@prisma/client";
import { SiteHeader, SiteFooter, AdSlot, AlertsBox, PageBanner } from "@/components/site/chrome";
import { ContentList, ContentDetail } from "@/components/site/content";
import { getContent, listCategories, listContents, listContractTypes, listCountries, relatedContents } from "@/lib/content";
import { CONTENT_LABEL, SECTION } from "@/lib/routes";
import { ogImageUrl } from "@/lib/og";
import { Pagination, pageHref, pageParam } from "@/components/site/pagination";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isHelpKind } from "@/lib/entraide";

/* Fabrique des pages de rubrique : bandeau, filtres (GET), liste réelle,
   état vide honnête, colonne latérale. Et la fiche détail générique. */

export type SectionConfig = {
  section: string;
  pre: string;
  em: string;
  desc: string;
  types: ContentType[];
  placeholder: string;
  categoryLabel?: string;
  categoriesFrom?: ContentType;
  contractTypes?: boolean;
  upcoming?: boolean;
  /** Rubrique Entraide : onglets Besoins / Offres d'aide. */
  helpKinds?: boolean;
  publishLabel: string;
  empty: { title: string; text: string };
  cols?: 2 | 3;
};

export type SectionSearch = Promise<{ q?: string; pays?: string; cat?: string; contrat?: string; mot?: string; aide?: string; page?: string }>;
const PAR_PAGE = 30;

const SELECT = "rounded border border-line bg-paper px-3 py-2 text-sm";

export async function SectionListPage({ config, searchParams }: { config: SectionConfig; searchParams: SectionSearch }) {
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const aide = config.helpKinds && isHelpKind(sp.aide) ? sp.aide : undefined;
  const [{ items, total }, countries, categories, contrats] = await Promise.all([
    listContents({ types: config.types, q: sp.q, country: sp.pays, category: sp.cat, contractType: sp.contrat, keyword: sp.mot, helpKind: aide, upcoming: config.upcoming, take: PAR_PAGE, skip: (page - 1) * PAR_PAGE }),
    listCountries(config.types),
    config.categoriesFrom ? listCategories(config.categoriesFrom) : Promise.resolve([] as string[]),
    config.contractTypes ? listContractTypes() : Promise.resolve([] as string[]),
  ]);
  const filtre = Boolean(sp.q || sp.pays || sp.cat || sp.contrat || sp.mot || aide);
  const lienAide = (kind?: string) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: sp.q, pays: sp.pays, cat: sp.cat, mot: sp.mot, aide: kind })) if (v) u.set(k, v);
    const qs = u.toString();
    return `${config.section}${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <SiteHeader />
      <PageBanner pre={config.pre} em={config.em} desc={config.desc}>
        <Link href="/publier" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
          {config.publishLabel}
        </Link>
      </PageBanner>

      {config.helpKinds && (
        <nav aria-label="Type de demande" className="border-b border-line bg-paper">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 pt-3">
            {([undefined, "NEED", "OFFER"] as const).map((k) => {
              const actif = (aide ?? undefined) === k;
              return (
                <Link key={k ?? "tout"} href={lienAide(k)} aria-current={actif ? "page" : undefined} className={`-mb-px border-b-2 px-3 py-2 text-sm font-bold ${actif ? "border-primary text-primary" : "border-transparent text-ink-2 hover:text-primary"}`}>
                  {k === "NEED" ? "Besoins d'aide" : k === "OFFER" ? "Offres d'aide" : "Tout"}
                </Link>
              );
            })}
            <Link href="/compte/alertes#entraide" className="ml-auto whitespace-nowrap py-2 text-xs font-bold uppercase text-primary hover:underline">Devenir volontaire dans ma ville</Link>
          </div>
        </nav>
      )}

      <form action={config.section} className="border-b border-line bg-paper-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          {aide && <input type="hidden" name="aide" value={aide} />}
          <input type="search" name="q" aria-label="Rechercher" defaultValue={sp.q ?? ""} placeholder={config.placeholder} className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none sm:w-64" />
          {countries.length > 0 && (
            <select name="pays" defaultValue={sp.pays ?? ""} aria-label="Pays" className={SELECT}>
              <option value="">Tous les pays</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {categories.length > 0 && (
            <select name="cat" defaultValue={sp.cat ?? ""} aria-label={config.categoryLabel ?? "Catégorie"} className={SELECT}>
              <option value="">{config.categoryLabel ?? "Toutes les catégories"}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {contrats.length > 0 && (
            <select name="contrat" defaultValue={sp.contrat ?? ""} aria-label="Type de contrat" className={SELECT}>
              <option value="">Tous les contrats</option>
              {contrats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <button className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">Rechercher</button>
          <Link href="/#carte" className="ml-auto whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline">Voir sur la carte</Link>
        </div>
      </form>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <AdSlot slot="TOP" section={config.section.replace(/^\//, "")} className="mb-8" />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <p className="mb-5 text-sm text-muted">
              <strong className="text-ink">{total}</strong> {total > 1 ? "résultats" : "résultat"}
              {filtre && <> — <Link href={config.section} className="font-bold text-primary hover:underline">tout afficher</Link></>}
            </p>
            <ContentList
              items={items}
              cols={config.cols}
              empty={filtre ? { title: "Rien ne correspond à ces critères", text: "Essayez d'autres mots ou retirez un filtre.", href: config.section, cta: "Tout afficher" } : { ...config.empty, href: "/publier", cta: config.publishLabel }}
            />
            <Pagination page={page} total={total} perPage={PAR_PAGE} href={pageHref(config.section, { q: sp.q, pays: sp.pays, cat: sp.cat, contrat: sp.contrat, mot: sp.mot, aide })} />
          </div>
          <aside className="space-y-8">
            <AlertsBox />
            <AdSlot slot="SIDE" section={config.section.replace(/^\//, "")} />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export async function contentMetadata(slug: string, fallback: string): Promise<Metadata> {
  const item = await getContent(slug);
  if (!item) return { title: fallback };
  const image = ogImageUrl({ title: item.title, kind: CONTENT_LABEL[item.type], place: [item.city, item.country].filter(Boolean).join(", ") });
  return {
    title: item.title,
    description: item.excerpt ?? undefined,
    openGraph: { type: "article", title: item.title, description: item.excerpt ?? undefined, images: [{ url: image, width: 1200, height: 630, alt: item.title }] },
  };
}

export async function ContentDetailPage({ slug, types }: { slug: string; types: ContentType[] }) {
  const item = await getContent(slug);
  if (!item || !types.includes(item.type)) notFound();
  after(() => db.content.update({ where: { id: item.id }, data: { views: { increment: 1 } } }).catch(() => {}));
  const [related, session] = await Promise.all([relatedContents(item), auth()]);
  const rsvpCount = item.type === "EVENT" ? await db.eventRsvp.count({ where: { contentId: item.id } }) : 0;
  /* L'organisateur (auteur) et l'équipe voient qui vient. */
  const estOrganisateur = session?.user && (item.ownerProfile?.user.id === session.user.id || ["EDITOR", "MODERATOR", "ADMIN"].includes(session.user.role ?? ""));
  const participants = item.type === "EVENT" && estOrganisateur
    ? (await db.eventRsvp.findMany({ where: { contentId: item.id }, include: { user: { select: { profile: { select: { slug: true, displayName: true } } } } }, orderBy: { createdAt: "asc" } })).flatMap((r) => (r.user.profile ? [r.user.profile] : []))
    : [];
  /* Bonnes adresses : recommandations publiées + celle du visiteur connecté. */
  const recommendations = item.type === "PLACE"
    ? await db.recommendation.findMany({ where: { contentId: item.id, status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, text: true, createdAt: true, author: { select: { profile: { select: { slug: true, displayName: true, photo: true } } } } } })
    : [];
  const myReco = item.type === "PLACE" && session?.user
    ? await db.recommendation.findUnique({ where: { authorId_contentId: { authorId: session.user.id, contentId: item.id } }, select: { id: true, text: true, status: true } })
    : null;
  const viewer = session?.user
    ? await (async () => {
        const [p, f, r] = await Promise.all([
          db.profile.findUnique({ where: { userId: session.user.id }, select: { cvUrl: true } }),
          db.favorite.findUnique({ where: { userId_contentId: { userId: session.user.id, contentId: item.id } }, select: { userId: true } }),
          item.type === "EVENT" ? db.eventRsvp.findUnique({ where: { contentId_userId: { contentId: item.id, userId: session.user.id } }, select: { userId: true } }) : null,
        ]);
        return { id: session.user.id, cvUrl: p?.cvUrl ?? null, favori: Boolean(f), going: Boolean(r) };
      })()
    : null;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <ContentDetail item={item} related={related} viewer={viewer} rsvpCount={rsvpCount} participants={participants} recommendations={recommendations} myReco={myReco} />
          <aside className="space-y-8">
            <AdSlot slot="SIDE" section={SECTION[item.type].replace(/^\//, "")} />
            <AlertsBox />
            <Link href={SECTION[item.type]} className="block border border-line p-4 text-sm font-bold text-primary hover:underline">
              ← Tous les contenus « {CONTENT_LABEL[item.type]} »
            </Link>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

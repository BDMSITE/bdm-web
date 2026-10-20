import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ContentType } from "@prisma/client";
import { SiteHeader, SiteFooter, AdSlot, AlertsBox, PageBanner } from "@/components/site/chrome";
import { ContentList, ContentDetail } from "@/components/site/content";
import { getContent, listCategories, listContents, listContractTypes, listCountries, relatedContents } from "@/lib/content";
import { CONTENT_LABEL, SECTION } from "@/lib/routes";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
  publishLabel: string;
  empty: { title: string; text: string };
  cols?: 2 | 3;
};

export type SectionSearch = Promise<{ q?: string; pays?: string; cat?: string; contrat?: string; mot?: string }>;

const SELECT = "rounded border border-line bg-paper px-3 py-2 text-sm";

export async function SectionListPage({ config, searchParams }: { config: SectionConfig; searchParams: SectionSearch }) {
  const sp = await searchParams;
  const [{ items, total }, countries, categories, contrats] = await Promise.all([
    listContents({ types: config.types, q: sp.q, country: sp.pays, category: sp.cat, contractType: sp.contrat, keyword: sp.mot, upcoming: config.upcoming, take: 30 }),
    listCountries(config.types),
    config.categoriesFrom ? listCategories(config.categoriesFrom) : Promise.resolve([] as string[]),
    config.contractTypes ? listContractTypes() : Promise.resolve([] as string[]),
  ]);
  const filtre = Boolean(sp.q || sp.pays || sp.cat || sp.contrat || sp.mot);

  return (
    <>
      <SiteHeader />
      <PageBanner pre={config.pre} em={config.em} desc={config.desc}>
        <Link href="/publier" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
          {config.publishLabel}
        </Link>
      </PageBanner>

      <form action={config.section} className="border-b border-line bg-paper-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          <input type="search" name="q" defaultValue={sp.q ?? ""} placeholder={config.placeholder} className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none sm:w-64" />
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
          <Link href="/" className="ml-auto whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline">Voir sur la carte</Link>
        </div>
      </form>

      <main className="mx-auto max-w-6xl px-4 py-8">
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
            {total > items.length && <p className="mt-6 text-center text-sm text-muted">{items.length} affichés sur {total} — affinez avec les filtres.</p>}
          </div>
          <aside className="space-y-8">
            <AlertsBox />
            <AdSlot label="pavé latéral" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export async function contentMetadata(slug: string, fallback: string): Promise<Metadata> {
  const item = await getContent(slug);
  return { title: item?.title ?? fallback, description: item?.excerpt ?? undefined };
}

export async function ContentDetailPage({ slug, types }: { slug: string; types: ContentType[] }) {
  const item = await getContent(slug);
  if (!item || !types.includes(item.type)) notFound();
  const [related, session] = await Promise.all([relatedContents(item), auth()]);
  const viewer = session?.user
    ? { id: session.user.id, cvUrl: (await db.profile.findUnique({ where: { userId: session.user.id }, select: { cvUrl: true } }))?.cvUrl ?? null }
    : null;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <ContentDetail item={item} related={related} viewer={viewer} />
          <aside className="space-y-8">
            <AdSlot label="pavé latéral" />
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

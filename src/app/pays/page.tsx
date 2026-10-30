import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, PageBanner, SectionTitle } from "@/components/site/chrome";
import { db } from "@/lib/db";
import { publicProfileWhere } from "@/lib/content";
import { slugify } from "@/lib/slug";

export const metadata: Metadata = {
  title: "La diaspora par pays",
  description: "Les Béninois pays par pays : membres, événements, bonnes adresses, offres et contacts utiles, de la France au Canada, du Togo aux États-Unis.",
};

/* Index des pages pays : chaque pays où vit au moins un membre, ou où un contenu est publié. */

export const revalidate = 900;

export default async function PaysIndexPage() {
  const [membres, contenus] = await Promise.all([
    db.profile.groupBy({ by: ["country"], where: { ...publicProfileWhere(), country: { not: null } }, _count: { _all: true } }),
    db.content.groupBy({ by: ["country"], where: { status: "PUBLISHED", country: { not: null } }, _count: { _all: true } }),
  ]);
  const pays = new Map<string, { membres: number; contenus: number }>();
  for (const m of membres) if (m.country) pays.set(m.country, { membres: m._count._all, contenus: 0 });
  for (const c of contenus) if (c.country) pays.set(c.country, { membres: pays.get(c.country)?.membres ?? 0, contenus: c._count._all });
  const liste = [...pays.entries()].map(([nom, n]) => ({ nom, slug: slugify(nom), ...n })).sort((a, b) => b.membres - a.membres || b.contenus - a.contenus || a.nom.localeCompare(b.nom, "fr"));
  const totalMembres = liste.reduce((s, p) => s + p.membres, 0);

  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="La diaspora"
        em="par pays"
        desc={`${liste.length} pays où vivent des Béninois inscrits sur le site. Chaque page pays rassemble les membres, les événements, les bonnes adresses, les offres et les contacts utiles.`}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section>
            <SectionTitle pre={`${totalMembres} membres dans`} em={`${liste.length} pays`} />
            {liste.length === 0 ? (
              <p className="border border-dashed border-line bg-paper-2 p-6 text-center text-sm text-ink-2">Aucun pays renseigné pour l&apos;instant.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {liste.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/pays/${p.slug}`} className="flex items-center justify-between gap-3 border border-line p-4 hover:border-primary hover:bg-primary-faint">
                      <span className="font-display text-lg font-extrabold leading-tight">{p.nom}</span>
                      <span className="shrink-0 text-right text-xs text-ink-2">
                        <span className="block font-bold text-primary-dark">{p.membres} membre{p.membres > 1 ? "s" : ""}</span>
                        {p.contenus > 0 && <span>{p.contenus} contenu{p.contenus > 1 ? "s" : ""}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">Votre pays <em>manque ?</em></h3>
              <p className="mt-2 text-sm text-ink-2">Il apparaît dès qu&apos;un membre y renseigne sa résidence. Inscrivez-vous et indiquez votre pays et votre ville.</p>
              <Link href="/inscription" className="mt-3 inline-block w-full rounded bg-primary py-2 text-center text-sm font-bold text-white hover:bg-primary-dark">Je m&apos;inscris</Link>
            </div>
            <AdSlot slot="SIDE" section="communaute" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

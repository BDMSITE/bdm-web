import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter, AdSlot, AlertsBox, PageBanner, SectionTitle } from "@/components/site/chrome";
import { ContentList } from "@/components/site/content";
import { Avatar } from "@/components/site/avatar";
import { db } from "@/lib/db";
import { listContents, listProfiles, publicProfileWhere } from "@/lib/content";
import { profileHref } from "@/lib/routes";
import { ogImageUrl } from "@/lib/og";
import { slugify } from "@/lib/slug";
import { enPays } from "@/lib/pays";

type Props = { params: Promise<{ slug: string }> };

/* Page pays : tout ce que le site sait d'un pays de la diaspora (membres, agenda, adresses,
   offres, bons plans, annonces) + contacts utiles. Le nom du pays vient des données réelles. */

export const revalidate = 900;

async function resolveCountry(slug: string) {
  const [profils, contenus] = await Promise.all([
    db.profile.findMany({ where: { ...publicProfileWhere(), country: { not: null } }, distinct: ["country"], select: { country: true } }),
    db.content.findMany({ where: { status: "PUBLISHED", country: { not: null } }, distinct: ["country"], select: { country: true } }),
  ]);
  const noms = [...new Set([...profils, ...contenus].map((r) => r.country).filter((c): c is string => Boolean(c)))];
  return noms.find((n) => slugify(n) === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pays = await resolveCountry((await params).slug);
  if (!pays) return { title: "Pays introuvable" };
  const title = `Les Béninois ${enPays(pays)}`;
  const description = `Membres, événements, bonnes adresses, offres d'emploi et contacts utiles de la diaspora béninoise : ${pays}.`;
  return { title, description, openGraph: { title, description, images: [{ url: ogImageUrl({ title, kind: "Pays" }), width: 1200, height: 630, alt: title }] } };
}

export default async function PaysPage({ params }: Props) {
  const { slug } = await params;
  const pays = await resolveCountry(slug);
  if (!pays) notFound();

  const [membres, agenda, offres, adresses, bonsPlans, annonces, villes] = await Promise.all([
    listProfiles({ country: pays, take: 9 }),
    listContents({ types: ["EVENT"], country: pays, upcoming: true, take: 4 }),
    listContents({ types: ["JOB", "INTERNSHIP"], country: pays, take: 4 }),
    listContents({ types: ["PLACE"], country: pays, take: 4 }),
    listContents({ types: ["DEAL"], country: pays, take: 3 }),
    listContents({ types: ["CLASSIFIED", "HELP_REQUEST"], country: pays, take: 3 }),
    db.profile.groupBy({ by: ["city"], where: { ...publicProfileWhere(), country: pays, city: { not: null } }, _count: { _all: true }, orderBy: { _count: { city: "desc" } }, take: 8 }),
  ]);
  const q = encodeURIComponent(pays);
  const sections: { pre: string; em: string; href: string; items: typeof agenda.items; total: number; vide: string }[] = [
    { pre: "Événements", em: "à venir", href: `/agenda?pays=${q}`, items: agenda.items, total: agenda.total, vide: "Aucun événement annoncé pour l'instant dans ce pays." },
    { pre: "Offres d'emploi", em: "et stages", href: `/emploi?pays=${q}`, items: offres.items, total: offres.total, vide: "Aucune offre publiée pour l'instant dans ce pays." },
    { pre: "Bonnes", em: "adresses", href: `/adresses?pays=${q}`, items: adresses.items, total: adresses.total, vide: "Aucune adresse recommandée pour l'instant dans ce pays." },
    { pre: "Bons", em: "plans", href: `/bons-plans?pays=${q}`, items: bonsPlans.items, total: bonsPlans.total, vide: "Aucun bon plan pour l'instant dans ce pays." },
    { pre: "Annonces et", em: "mises en relation", href: `/annonces?pays=${q}`, items: annonces.items, total: annonces.total, vide: "Aucune annonce pour l'instant dans ce pays." },
  ];

  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Les Béninois"
        em={enPays(pays)}
        desc={`${membres.total} membre${membres.total > 1 ? "s" : ""} inscrit${membres.total > 1 ? "s" : ""}${villes.length ? ` · ${villes.map((v) => v.city).join(", ")}` : ""}. Tout ce que la communauté publie dans ce pays, et les contacts utiles.`}
      >
        <Link href={`/communaute/membres?pays=${q}`} className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">Tous les membres</Link>
        <Link href="/#carte" className="whitespace-nowrap rounded border border-white/40 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">Voir sur la carte</Link>
      </PageBanner>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <SectionTitle pre="Membres" em={`(${membres.total})`} href={membres.total > 0 ? `/communaute/membres?pays=${q}` : undefined} />
              {membres.items.length === 0 ? (
                <p className="border border-dashed border-line bg-paper-2 p-6 text-center text-sm text-ink-2">Aucun membre visible dans l&apos;annuaire pour ce pays.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {membres.items.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 border border-line p-3 hover:border-primary hover:bg-primary-faint">
                      <Avatar name={m.displayName} photo={m.photo} />
                      <div className="min-w-0">
                        <Link href={profileHref(m.slug)} className="font-bold leading-tight hover:text-primary">{m.displayName}</Link>
                        <p className="card-location mt-0.5">{[m.city, m.headline].filter(Boolean).join(" · ")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {sections.map((s) => (
              <section key={s.em}>
                <SectionTitle pre={s.pre} em={s.em} href={s.total > 0 ? s.href : undefined} />
                <ContentList items={s.items} cols={2} empty={{ title: s.vide, text: "Membre dans ce pays ? Publiez : la communauté locale vous lira en premier.", href: "/publier", cta: "Publier" }} />
              </section>
            ))}
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">Le HCBE <em>dans ce pays</em></h3>
              <p className="mt-2 text-sm text-ink-2">
                Le Haut Conseil des Béninois de l&apos;Extérieur s&apos;appuie sur des sections locales. Pour joindre les responsables de {pays} ou proposer une section, écrivez-nous.
              </p>
              <Link href="/contact?sujet=Question%20au%20HCBE" className="mt-3 inline-block w-full rounded bg-primary py-2 text-center text-sm font-bold text-white hover:bg-primary-dark">Contacter le HCBE</Link>
            </div>
            <div className="border border-line bg-paper-2 p-4 text-sm">
              <h3 className="section-title text-sm">Démarches <em>consulaires</em></h3>
              <p className="mt-2 text-ink-2">Passeport, état civil, carte consulaire : les démarches relèvent de l&apos;ambassade ou du consulat du Bénin compétent pour votre lieu de résidence. Les coordonnées officielles seront publiées ici dès validation par le HCBE.</p>
              <Link href="/pratique/demarches" className="mt-3 inline-block text-sm font-bold uppercase text-primary hover:underline">Guides de démarches →</Link>
            </div>
            <AlertsBox keywords={[pays]} />
            <AdSlot slot="SIDE" section="communaute" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { GraduationCap } from "lucide-react";
import { SiteHeader, SiteFooter, AdSlot, PageBanner } from "@/components/site/chrome";
import { Avatar } from "@/components/site/avatar";
import { Pagination, pageHref, pageParam } from "@/components/site/pagination";
import { db } from "@/lib/db";
import { profileHref } from "@/lib/routes";
import { publicProfileWhere } from "@/lib/content";

export const metadata: Metadata = {
  title: "Anciens élèves et promotions",
  description: "Retrouvez les Béninois du monde qui ont fréquenté la même école, la même université ou la même promotion que vous.",
};

/* Annuaire des anciens élèves : les écoles déclarées par les membres (profil → Formation),
   puis les membres d'une école, filtrables par promotion. Rien n'est inventé : une école
   n'apparaît que si au moins un membre visible l'a renseignée. */

const PAGE = 24;
type Props = { searchParams: Promise<{ ecole?: string; promo?: string; q?: string; page?: string }> };

export default async function AnciensPage({ searchParams }: Props) {
  const sp = await searchParams;
  const ecole = sp.ecole?.trim().slice(0, 120) ?? "";
  const promo = sp.promo && /^\d{4}$/.test(sp.promo) ? Number(sp.promo) : null;
  const q = sp.q?.trim().slice(0, 80) ?? "";
  const visible = publicProfileWhere();

  if (!ecole) {
    /* Liste des écoles : regroupées par slug, avec le nombre de membres et le nom le plus fréquent. */
    const rows = await db.education.groupBy({
      by: ["schoolSlug", "school"],
      where: { profile: visible, ...(q && { school: { contains: q, mode: "insensitive" } }) },
      _count: { profileId: true },
    });
    const parSlug = new Map<string, { slug: string; name: string; n: number }>();
    for (const r of rows) {
      const cur = parSlug.get(r.schoolSlug);
      if (!cur) parSlug.set(r.schoolSlug, { slug: r.schoolSlug, name: r.school, n: r._count.profileId });
      else { cur.n += r._count.profileId; if (r._count.profileId > cur.n / 2) cur.name = r.school; }
    }
    const ecoles = [...parSlug.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, "fr"));
    const membresAvecFormation = await db.profile.count({ where: { ...visible, educations: { some: {} } } });

    return (
      <>
        <SiteHeader />
        <PageBanner pre="Anciens élèves &" em="promotions" desc="La même école, la même université, la même promo : l'entraide professionnelle de la diaspora commence souvent là. Renseignez votre formation dans votre profil pour apparaître ici.">
          <Link href="/compte/profil#formation" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">Ajouter ma formation</Link>
        </PageBanner>
        <form action="/communaute/anciens" className="border-b border-line bg-paper-2">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
            <input type="search" name="q" aria-label="Rechercher une école" defaultValue={q} placeholder="Nom d'une école, d'une université…" className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none sm:w-80" />
            <button className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">Rechercher</button>
            <span className="ml-auto text-sm text-muted"><strong className="text-ink">{ecoles.length}</strong> école{ecoles.length > 1 ? "s" : ""} · <strong className="text-ink">{membresAvecFormation}</strong> membre{membresAvecFormation > 1 ? "s" : ""}</span>
          </div>
        </form>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              {ecoles.length === 0 ? (
                <div className="border border-dashed border-line bg-paper-2 p-8 text-center">
                  <GraduationCap aria-hidden className="mx-auto h-8 w-8 text-primary" />
                  <p className="mt-2 font-display text-lg font-bold">{q ? "Aucune école ne correspond" : "Aucune formation renseignée pour l'instant"}</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">Les écoles apparaissent dès qu&apos;un membre les indique dans son profil. Soyez le premier de votre promo.</p>
                  <Link href="/compte/profil#formation" className="mt-4 inline-block rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">Renseigner ma formation</Link>
                </div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {ecoles.map((e) => (
                    <li key={e.slug}>
                      <Link href={`/communaute/anciens?ecole=${encodeURIComponent(e.slug)}`} className="flex h-full items-center gap-3 border border-line p-4 hover:border-primary hover:bg-primary-faint">
                        <GraduationCap aria-hidden className="h-6 w-6 shrink-0 text-primary" strokeWidth={2.2} />
                        <span className="min-w-0">
                          <span className="block truncate font-bold">{e.name}</span>
                          <span className="text-xs text-muted">{e.n} ancien{e.n > 1 ? "s" : ""} membre{e.n > 1 ? "s" : ""}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <aside className="space-y-8">
              <div className="border-2 border-primary bg-primary-faint p-4 text-sm">
                <p className="font-display text-lg font-bold">Comment ça marche</p>
                <p className="mt-1 text-ink-2">Dans <Link href="/compte/profil#formation" className="font-bold text-primary hover:underline">Mon profil public → Formation</Link>, indiquez vos écoles et votre année de sortie. Vous apparaissez aussitôt parmi les anciens, et les membres de votre promo peuvent vous écrire par le formulaire relais.</p>
              </div>
              <AdSlot slot="SIDE" section="communaute" />
            </aside>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  /* Membres d'une école, filtrables par promotion. */
  const where: Prisma.ProfileWhereInput = { ...visible, educations: { some: { schoolSlug: ecole, ...(promo && { endYear: promo }) } } };
  const page = pageParam(sp.page);
  const [membres, total, promos, nom] = await Promise.all([
    db.profile.findMany({ where, orderBy: { displayName: "asc" }, take: PAGE, skip: (page - 1) * PAGE, include: { educations: { where: { schoolSlug: ecole } }, keywords: { include: { keyword: true } } } }),
    db.profile.count({ where }),
    db.education.findMany({ where: { schoolSlug: ecole, endYear: { not: null }, profile: visible }, distinct: ["endYear"], select: { endYear: true }, orderBy: { endYear: "desc" } }),
    db.education.findFirst({ where: { schoolSlug: ecole, profile: visible }, select: { school: true } }),
  ]);
  const titre = nom?.school ?? ecole;
  const base = `/communaute/anciens?ecole=${encodeURIComponent(ecole)}`;

  return (
    <>
      <SiteHeader />
      <PageBanner pre="Anciens de" em={titre} desc={promo ? `Promotion ${promo}.` : "Les membres qui ont fréquenté cet établissement, toutes promotions."}>
        <Link href="/communaute/anciens" className="whitespace-nowrap rounded border-2 border-white px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-primary-darker">← Toutes les écoles</Link>
      </PageBanner>
      <form action="/communaute/anciens" className="border-b border-line bg-paper-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          <input type="hidden" name="ecole" value={ecole} />
          <select name="promo" defaultValue={promo ? String(promo) : ""} aria-label="Promotion" className="rounded border border-line bg-paper px-3 py-2 text-sm">
            <option value="">Toutes les promotions</option>
            {promos.map((p) => <option key={p.endYear!} value={p.endYear!}>Promo {p.endYear}</option>)}
          </select>
          <button className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">Filtrer</button>
          <span className="ml-auto text-sm text-muted"><strong className="text-ink">{total}</strong> ancien{total > 1 ? "s" : ""}</span>
        </div>
      </form>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            {membres.length === 0 ? (
              <p className="border border-line p-6 text-center text-sm text-muted">Aucun membre pour cette sélection. <Link href={base} className="font-bold text-primary hover:underline">Toutes les promotions</Link></p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {membres.map((m) => (
                  <article key={m.id} className="border border-line p-4 hover:border-primary hover:bg-primary-faint">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.displayName} photo={m.photo} />
                      <div className="min-w-0">
                        <h2 className="font-bold leading-tight"><Link href={profileHref(m.slug)} className="hover:text-primary">{m.displayName}</Link></h2>
                        {m.headline && <p className="truncate text-sm text-ink-2">{m.headline}</p>}
                        <p className="card-location mt-0.5">{[m.city, m.country].filter(Boolean).join(" · ")}</p>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-0.5 text-xs text-ink-2">
                      {m.educations.map((e) => (
                        <li key={e.id}>{[e.field, e.endYear ? `promo ${e.endYear}` : null].filter(Boolean).join(" · ") || "Formation renseignée"}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
            <Pagination page={page} total={total} perPage={PAGE} href={pageHref("/communaute/anciens", { ecole, promo: promo ? String(promo) : undefined })} />
          </div>
          <aside className="space-y-8">
            <div className="border-2 border-primary bg-primary-faint p-4 text-center text-sm">
              <p className="font-display text-lg font-bold">Vous aussi, ancien de {titre} ?</p>
              <p className="mt-1 text-ink-2">Ajoutez cette école à votre profil pour rejoindre la liste.</p>
              <Link href="/compte/profil#formation" className="mt-3 inline-block rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">Ma formation</Link>
            </div>
            <AdSlot slot="SIDE" section="communaute" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

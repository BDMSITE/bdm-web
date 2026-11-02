import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, PageBanner, SectionTitle } from "@/components/site/chrome";
import { db } from "@/lib/db";
import { publicProfileWhere } from "@/lib/content";
import { CONTENT_LABEL } from "@/lib/routes";
import { slugify } from "@/lib/slug";
import type { ContentType } from "@prisma/client";

export const metadata: Metadata = {
  title: "La diaspora en chiffres",
  description: "Les Béninois du monde en chiffres réels : membres par pays, par secteur, inscriptions mois par mois, contenus publiés. Données du site, mises à jour en continu.",
};

/* Chiffres publics, calculés en direct depuis la base : aucun nombre saisi à la main.
   Utile pour la presse, les partenaires et le HCBE. */

export const revalidate = 3600;

function Barre({ label, n, max, href }: { label: string; n: number; max: number; href?: string }) {
  const w = Math.max(2, Math.round((n / Math.max(1, max)) * 100));
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 truncate font-semibold">{href ? <Link href={href} className="hover:text-primary hover:underline">{label}</Link> : label}</span>
      <span className="h-3 flex-1 bg-paper-2"><span className="block h-3 bg-primary" style={{ width: `${w}%` }} /></span>
      <span className="w-12 shrink-0 text-right tabular-nums text-ink-2">{n.toLocaleString("fr-FR")}</span>
    </li>
  );
}

export default async function ChiffresPage() {
  const where = publicProfileWhere();
  const depuis12 = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 11, 1));
  const [membres, parPays, parSecteur, inscrits, contenus, villes, experts, accueil] = await Promise.all([
    db.profile.count({ where }),
    db.profile.groupBy({ by: ["country"], where: { ...where, country: { not: null } }, _count: { _all: true }, orderBy: { _count: { country: "desc" } }, take: 12 }),
    db.keyword.findMany({ where: { family: "SECTOR" }, select: { name: true, _count: { select: { profiles: true } } }, orderBy: { profiles: { _count: "desc" } }, take: 10 }),
    db.user.findMany({ where: { status: "ACTIVE", createdAt: { gte: depuis12 } }, select: { createdAt: true } }),
    db.content.groupBy({ by: ["type"], where: { status: "PUBLISHED" }, _count: { _all: true }, orderBy: { _count: { type: "desc" } } }),
    db.profile.findMany({ where: { ...where, city: { not: null } }, distinct: ["city"], select: { city: true } }),
    db.profile.count({ where: { ...where, expertStatus: "APPROVED" } }),
    db.hostingOffer.count({ where: { status: "PUBLISHED" } }),
  ]);
  const mois: { label: string; n: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    mois.push({ label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit", timeZone: "UTC" }), n: inscrits.filter((u) => `${u.createdAt.getUTCFullYear()}-${u.createdAt.getUTCMonth()}` === key).length });
  }
  const totalContenus = contenus.reduce((s, c) => s + c._count._all, 0);
  const maxPays = Math.max(1, ...parPays.map((p) => p._count._all));
  const maxSect = Math.max(1, ...parSecteur.map((s) => s._count.profiles));
  const maxMois = Math.max(1, ...mois.map((m) => m.n));

  return (
    <>
      <SiteHeader />
      <PageBanner pre="La diaspora" em="en chiffres" desc="Des chiffres réels, calculés en direct à partir des inscrits et des publications du site. Rien n'est saisi à la main." />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { l: "Membres visibles", n: membres, href: "/communaute/membres" },
                { l: "Pays", n: parPays.length, href: "/pays" },
                { l: "Villes", n: villes.length, href: "/#carte" },
                { l: "Contenus publiés", n: totalContenus, href: "/recherche" },
                { l: "Experts validés", n: experts, href: "/communaute/competences" },
                { l: "Fiches d'accueil", n: accueil, href: "/pratique/accueil" },
              ].map((c) => (
                <Link key={c.l} href={c.href} className="border border-line p-4 hover:border-primary hover:bg-primary-faint">
                  <p className="font-display text-3xl font-black text-primary">{c.n.toLocaleString("fr-FR")}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-2">{c.l}</p>
                </Link>
              ))}
            </section>
            <section>
              <SectionTitle pre="Membres par" em="pays" href="/pays" />
              {parPays.length === 0 ? <p className="text-sm text-muted">Aucun pays renseigné pour l&apos;instant.</p> : (
                <ul className="space-y-2">{parPays.map((p) => <Barre key={p.country} label={p.country!} n={p._count._all} max={maxPays} href={`/pays/${slugify(p.country!)}`} />)}</ul>
              )}
            </section>
            <section>
              <SectionTitle pre="Membres par" em="secteur" href="/communaute/membres" />
              {parSecteur.every((s) => s._count.profiles === 0) ? <p className="text-sm text-muted">Aucun secteur renseigné pour l&apos;instant.</p> : (
                <ul className="space-y-2">{parSecteur.filter((s) => s._count.profiles > 0).map((s) => <Barre key={s.name} label={s.name} n={s._count.profiles} max={maxSect} />)}</ul>
              )}
            </section>
            <section>
              <SectionTitle pre="Inscriptions" em="mois par mois" />
              <ul className="space-y-2">{mois.map((m) => <Barre key={m.label} label={m.label} n={m.n} max={maxMois} />)}</ul>
              <p className="mt-2 text-xs text-muted">Comptes actifs (adresse confirmée) créés sur les douze derniers mois.</p>
            </section>
            <section>
              <SectionTitle pre="Contenus" em="publiés" />
              <ul className="space-y-2">{contenus.map((c) => <Barre key={c.type} label={CONTENT_LABEL[c.type as ContentType]} n={c._count._all} max={Math.max(1, ...contenus.map((x) => x._count._all))} />)}</ul>
            </section>
          </div>
          <aside className="space-y-8">
            <div className="border-2 border-primary p-4 text-sm">
              <h3 className="section-title text-sm">Presse et <em>partenaires</em></h3>
              <p className="mt-2 text-ink-2">Ces chiffres se mettent à jour toutes les heures. Pour un dossier détaillé ou une interview, écrivez-nous.</p>
              <Link href="/contact?sujet=Presse" className="mt-3 inline-block w-full rounded bg-primary py-2 text-center text-sm font-bold text-white hover:bg-primary-dark">Nous écrire</Link>
            </div>
            <AdSlot slot="SIDE" section="communaute" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, PageBanner } from "@/components/site/chrome";
import { EmptyState } from "@/components/site/content";
import { db } from "@/lib/db";
import { HOSTING_KIND_LABEL, HOSTING_AUDIENCE_LABEL, hostingAudience } from "@/lib/competences";

export const metadata: Metadata = { title: "Accueil & hébergement" };

/* Familles d'accueil (CDC §7.10) : fiches proposées par les membres depuis leur espace,
   relues par le HCBE, mise en relation par la messagerie relais (aucune coordonnée publiée). */

export default async function AccueilHebergementPage() {
  const fiches = await db.hostingOffer.findMany({
    where: { status: "PUBLISHED", profile: { user: { status: "ACTIVE" } } },
    orderBy: { updatedAt: "desc" },
    take: 60,
    include: { profile: { select: { slug: true, displayName: true } } },
  });
  const pays = [...new Set(fiches.map((f) => f.country))].sort();
  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Accueil &"
        em="hébergement"
        desc="Des familles de la communauté accueillent des étudiants béninois qui arrivent à l'étranger, des visiteurs de passage et des afrodescendants en voyage au Bénin. Fiches vérifiées par le HCBE, mise en relation par la messagerie du site, gratuite entre membres."
      >
        <Link href="/compte/accueil" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
          Proposer un accueil
        </Link>
      </PageBanner>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <h2 className="section-title mb-5 border-b-2 border-line pb-2 text-lg">
              Le <em>principe</em>
            </h2>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {[
                { n: "1", t: "La famille crée sa fiche", d: "Ville, type d'accueil, durée, conditions." },
                { n: "2", t: "Le HCBE vérifie", d: "Échange avec la famille avant mise en ligne." },
                { n: "3", t: "Mise en relation modérée", d: "Messagerie relais, jamais de coordonnées publiées." },
              ].map((s) => (
                <div key={s.n} className="border border-line p-4">
                  <span className="font-display text-2xl font-black text-line">{s.n}</span>
                  <p className="mt-1 font-bold">{s.t}</p>
                  <p className="text-sm text-ink-2">{s.d}</p>
                </div>
              ))}
            </div>

            {fiches.length === 0 ? (
              <EmptyState
                title="Les premières fiches d'accueil arrivent"
                text="Vous avez une chambre, un logement ou une place à table pour un étudiant qui arrive, un visiteur ou un afrodescendant en voyage ? Proposez votre accueil : le HCBE échange avec vous avant la mise en ligne."
                href="/compte/accueil"
                cta="Proposer un accueil"
              />
            ) : (
              <>
                <p className="mb-4 text-sm text-ink-2"><strong>{fiches.length}</strong> fiche{fiches.length > 1 ? "s" : ""} d&apos;accueil vérifiée{fiches.length > 1 ? "s" : ""} · {pays.join(" · ")}</p>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {fiches.map((f) => (
                    <li key={f.id} className="flex flex-col border border-line p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">{HOSTING_KIND_LABEL[f.kind]}{f.capacity ? ` · ${f.capacity} pers.` : ""}</p>
                      <h3 className="mt-1 font-display text-xl font-extrabold leading-tight">{f.city}, {f.country}</h3>
                      <p className="card-location mt-1">Chez {f.profile.displayName}{f.duration ? ` · ${f.duration}` : ""}</p>
                      <p className="mt-2 text-xs font-semibold text-ink-2">{hostingAudience(f.audience).map((a) => HOSTING_AUDIENCE_LABEL[a]).join(" · ")}</p>
                      <p className="mt-2 line-clamp-4 text-sm text-ink-2">{f.conditions}</p>
                      <Link href={`/communaute/membres/${f.profile.slug}#ecrire`} className="mt-4 inline-block self-start rounded border-2 border-primary px-3 py-1.5 text-xs font-bold uppercase text-primary hover:bg-primary hover:text-white">
                        Écrire à l&apos;hôte
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-4 text-xs text-muted">
              L&apos;accueil est un service entre membres : le HCBE vérifie les fiches, mais chacun reste responsable de sa mise en relation (charte à accepter).
            </p>
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">Vous partez <em>étudier ?</em></h3>
              <p className="mt-2 text-sm text-ink-2">Créez votre compte pour écrire aux hôtes et publier votre recherche d&apos;accueil dans « Chercher / trouver ».</p>
              <Link href="/inscription" className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">Créer mon compte</Link>
            </div>
            <AdSlot slot="SIDE" section="pratique" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

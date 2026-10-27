import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, PageBanner } from "@/components/site/chrome";
import { EmptyState } from "@/components/site/content";

export const metadata: Metadata = { title: "Accueil & hébergement" };

/* Familles d'accueil (CDC §7.10) : le principe est décrit honnêtement comme
   « à venir ». Aucune fiche d'hôte tant que le service n'est pas ouvert. */

export default function AccueilHebergementPage() {
  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Accueil &"
        em="hébergement"
        desc="Un service à venir : des familles de la communauté pourront accueillir des étudiants béninois qui arrivent à l'étranger, des visiteurs et des afrodescendants au Bénin. Mise en relation modérée, gratuite entre membres."
      />

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

            <EmptyState
              title="Service en préparation"
              text="Les fiches des familles d'accueil apparaîtront ici à l'ouverture du service. En attendant, vous pouvez publier une recherche ou une proposition d'accueil dans « Chercher / trouver » : elle sera relue par la modération."
              href="/publier"
              cta="Publier une demande"
            />
            <p className="mt-4 text-xs text-muted">
              L&apos;accueil est un service entre membres : le HCBE vérifie les fiches, mais chacun reste responsable de sa mise en relation (charte à accepter).
            </p>
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">Vous partez <em>étudier ?</em></h3>
              <p className="mt-2 text-sm text-ink-2">Créez votre compte pour être informé·e de l&apos;ouverture du service et publier votre recherche d&apos;accueil.</p>
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

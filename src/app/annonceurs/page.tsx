import Link from "next/link";
import type { Metadata } from "next";
import { SLOTS } from "@/lib/pub-slots";
import { SiteHeader, SiteFooter, SectionTitle, PageBanner } from "@/components/site/chrome";

export const metadata: Metadata = { title: "Annonceurs & partenaires" };

/* Page régie (CDC §7.14) : description du service réel, sans chiffres
   d'audience ni tarifs inventés — « tarifs communiqués sur demande ». */

const FORMATS = [
  ...SLOTS.map((s) => ({ t: s.label, d: `${s.where} Format ${s.desktop.w}×${s.desktop.h} px (mobile ${s.mobile.w}×${s.mobile.h}). Visuel fourni ou carte générée à vos couleurs.` })),
  { t: "Contenu partenaire", d: "Article ou dossier publié dans le magazine, clairement signalé comme contenu partenaire." },
  { t: "Avantage membres", d: "Votre offre de réduction publiée dans la rubrique Avantages, réservée aux membres du site." },
];

export default function AnnonceursPage() {
  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Annonceurs &"
        em="partenaires"
        desc="Touchez la diaspora béninoise et le Bénin : Béninois du Monde propose des emplacements publicitaires et des partenariats de contenu."
      >
        <Link href="/compte/publicite?nouvelle=1" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
          Déposer une campagne
        </Link>
      </PageBanner>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8">
        <section>
          <SectionTitle pre="Les" em="formats" />
          <div className="grid gap-6 lg:grid-cols-3">
            {FORMATS.map((p) => (
              <article key={p.t} className="border border-line p-6">
                <h3 className="font-display text-xl font-bold">{p.t}</h3>
                <p className="mt-2 text-sm text-ink-2">{p.d}</p>
                <p className="mt-3 text-sm font-bold text-primary">Tarifs communiqués sur demande</p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Les contenus partenaires sont toujours signalés comme tels. Les secteurs sensibles sont soumis à validation par le HCBE.
          </p>
        </section>

        <section>
          <SectionTitle pre="Qui" em="lit ?" />
          <p className="max-w-3xl text-sm leading-relaxed text-ink-2">
            Béninois du Monde s&apos;adresse aux Béninois de l&apos;extérieur, aux Béninois du pays et aux afrodescendants
            en quête de leurs racines. Les chiffres d&apos;audience du site seront communiqués sur demande, à partir de
            la mesure d&apos;audience réelle.
          </p>
        </section>

        <section className="border-2 border-primary p-6 text-center">
          <h2 className="font-display text-xl font-bold">Réserver une campagne</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-ink-2">Déposez votre campagne depuis votre espace membre (compte gratuit) : la régie vous répond avec le tarif et la date de mise en ligne. Vous pouvez aussi nous écrire par le formulaire de contact.</p>
          <Link href="/compte/publicite?nouvelle=1" className="mt-4 inline-block rounded bg-primary px-6 py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark">
            Nous contacter
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

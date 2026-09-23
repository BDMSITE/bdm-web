import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, KeywordChips } from "@/components/site/chrome";

export const metadata: Metadata = { title: "PME Fintech — Entreprise" };

/* MAQUETTE — Fiche entreprise (CDC §7.5), données d'exemple. */

const OFFRES = [
  { t: "Développeur full-stack h/f", type: "CDI", d: "expire le 14 nov." },
  { t: "Ingénieur structures h/f", type: "CDI", d: "en modération" },
  { t: "Stage data analyst (6 mois)", type: "Stage", d: "expire le 30 sept." },
];

export default function EntreprisePage() {
  return (
    <>
      <SiteHeader />

      {/* Bandeau fiche */}
      <div className="wax-bg bg-primary-darker py-8 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-5 px-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-white font-display text-xl font-extrabold text-primary-darker">
            LOGO
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-extrabold leading-tight">PME Fintech</h1>
              <span className="whitespace-nowrap rounded bg-accent px-2 py-0.5 text-xs font-bold uppercase text-ink">Partenaire RH</span>
            </div>
            <p className="mt-1 text-sm uppercase tracking-wider text-white/80">
              Paiement digital · 45 salariés · Cotonou · Bénin
            </p>
            <p className="mt-1 text-xs text-white/60">Membre depuis 2026 · 4 contenus publiés</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <button className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
              Écrire (relais)
            </button>
            <button className="whitespace-nowrap rounded border-2 border-white/60 px-4 py-2 text-sm font-bold hover:border-accent hover:text-accent">
              Suivre
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">À <em>propos</em></h2>
              <p className="max-w-2xl leading-relaxed">
                Plateforme de paiement utilisée par 40 000 marchands au Bénin et au Togo.
                Fondée en 2021 à Cotonou, l&apos;entreprise recrute au pays et dans la diaspora,
                avec un programme d&apos;accompagnement à la relocalisation.
              </p>
              <div className="mt-4">
                <KeywordChips keywords={["Fintech", "Informatique", "Cotonou", "Paiement", "Retour au pays"]} />
              </div>
            </section>

            <section>
              <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">3 offres <em>en cours</em></h2>
              <ul className="divide-y divide-line border border-line">
                {OFFRES.map((o) => (
                  <li key={o.t} className="flex items-center gap-4 p-4 hover:bg-primary-faint">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-snug">{o.t}</p>
                      <p className="mt-0.5 text-xs text-muted">{o.d}</p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded bg-primary-light px-2 py-1 text-xs font-bold text-primary-dark">{o.type}</span>
                    <Link href="/emploi/offre-exemple" className="shrink-0 whitespace-nowrap rounded border-2 border-primary px-3 py-1.5 text-xs font-bold uppercase text-primary hover:bg-primary hover:text-white">
                      Consulter
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">Dernières <em>actualités</em></h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {["PME Fintech ouvre son bureau de Lomé", "Recrutement réussi via Béninois du Monde : 3 devs embauchés"].map((t) => (
                  <article key={t} className="flex gap-4">
                    <div className="h-20 w-28 shrink-0 border border-line bg-paper-2" />
                    <h3 className="font-bold leading-snug"><Link href="/magazine/article-exemple" className="hover:text-primary">{t}</Link></h3>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid max-w-2xl gap-x-8 gap-y-3 border border-line p-5 text-sm sm:grid-cols-2">
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Site web</p><p className="mt-0.5 font-semibold text-primary">pmefintech.example</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Secteur</p><p className="mt-0.5">Fintech · Paiement digital</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Taille</p><p className="mt-0.5">45 salariés</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Contact</p><p className="mt-0.5 italic text-muted">Par formulaire relais uniquement</p></div>
            </section>
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">Cette entreprise <em>recrute</em></h3>
              <p className="mt-2 text-sm text-ink-2">Recevez ses prochaines offres par e-mail.</p>
              <button className="mt-3 w-full whitespace-nowrap rounded bg-primary py-2 text-sm font-bold text-white hover:bg-primary-dark">Créer une alerte</button>
            </div>
            <div className="border border-line bg-paper-2 p-4 text-sm">
              <h3 className="section-title text-sm">Entreprises <em>proches</em></h3>
              <ul className="mt-3 space-y-2">
                {["AgroBénin Export — Allada", "BTP Horizon — Abidjan", "Wax & Co — Montréal"].map((e) => (
                  <li key={e}><Link href="/communaute/entreprises" className="font-semibold hover:text-primary">{e}</Link></li>
                ))}
              </ul>
            </div>
            <AdSlot label="pavé latéral" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

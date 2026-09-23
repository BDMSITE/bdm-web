import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, SectionTitle, AdSlot, AlertsBox, PageBanner } from "@/components/site/chrome";

export const metadata: Metadata = { title: "Magazine" };

/* MAQUETTE — Accueil magazine (CDC §7.4), contenus d'exemple. */

const RUBRIQUES = [
  { label: "Actualités", href: "/magazine", active: true },
  { label: "Portraits & interviews", href: "/magazine/article-exemple" },
  { label: "Béninois qui comptent", href: "/magazine/beninois-qui-comptent" },
  { label: "Articles membres", href: "/magazine" },
  { label: "Retour au pays", href: "/retour-au-pays" },
];

const ARTICLES = [
  { title: "Retour à Cotonou : le parcours d'Aïchatou, ingénieure revenue de Montréal", cat: "Portrait", loc: "Cotonou · Bénin", big: true },
  { title: "Les secteurs qui recrutent au Bénin en 2026 : le grand dossier", cat: "Emploi", loc: "Bénin" },
  { title: "Angélique Kidjo au Zénith : la diaspora en chœur", cat: "Culture", loc: "Paris · France" },
  { title: "Étudier au Canada : les bourses ouvertes aux Béninois cette année", cat: "Étudiants", loc: "Canada" },
  { title: "La communauté béninoise de Paris prépare la fête nationale", cat: "Communauté", loc: "Paris · France" },
  { title: "Le vodun expliqué à mes enfants nés en France", cat: "Article membre", loc: "Lyon · France" },
  { title: "Les Agudas : ces Afro-Brésiliens revenus au Bénin il y a deux siècles", cat: "Mémoire", loc: "Ouidah · Bénin" },
  { title: "Investir dans l'immobilier à Cotonou depuis l'étranger : le guide", cat: "Retour au pays", loc: "Cotonou · Bénin" },
];

export default function MagazinePage() {
  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Le"
        em="magazine"
        desc="Actualités, portraits, parcours de retour au pays et articles publiés par les membres. Trois nouveaux articles par semaine."
      />

      {/* Sous-navigation rubriques */}
      <div className="border-b border-line bg-paper-2">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-7 gap-y-2 px-4 py-3 text-sm font-bold uppercase tracking-wide">
          {RUBRIQUES.map((r) => (
            <Link
              key={r.label}
              href={r.href}
              className={r.active ? "text-primary underline decoration-2 underline-offset-8" : "text-ink-2 hover:text-primary"}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <SectionTitle pre="À la" em="une" />
              <div className="grid gap-6 md:grid-cols-2">
                {ARTICLES.slice(0, 1).map((a) => (
                  <article key={a.title} className="md:col-span-2 md:grid md:grid-cols-2 md:gap-6">
                    <div className="mb-3 flex aspect-video items-center justify-center border border-line bg-paper-2 text-xs text-muted">photo</div>
                    <div>
                      <span className="inline-block bg-accent px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink">{a.cat}</span>
                      <h2 className="font-display mt-2 text-2xl font-black leading-snug">
                        <Link href="/magazine/article-exemple" className="hover:text-primary">{a.title}</Link>
                      </h2>
                      <p className="card-location mt-2">{a.loc}</p>
                      <p className="mt-3 text-ink-2">
                        Après neuf ans au Canada, elle a monté son bureau d&apos;études à Cotonou.
                        Démarches, surprises et conseils pour réussir son retour.
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <SectionTitle pre="Les derniers" em="articles" />
              <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
                {ARTICLES.slice(1).map((a) => (
                  <article key={a.title}>
                    <div className="mb-3 aspect-[16/9] border border-line bg-paper-2" />
                    <span className="text-[0.7rem] font-bold uppercase tracking-wider text-primary">{a.cat}</span>
                    <h3 className="mt-1 font-bold leading-snug">
                      <Link href="/magazine/article-exemple" className="hover:text-primary">{a.title}</Link>
                    </h3>
                    <p className="card-location mt-1.5">{a.loc}</p>
                  </article>
                ))}
              </div>
              <button className="mt-7 w-full rounded border-2 border-primary py-2.5 text-sm font-bold uppercase text-primary hover:bg-primary hover:text-white">
                Afficher plus d&apos;articles
              </button>
            </section>
          </div>

          <aside className="space-y-8">
            <AdSlot label="pavé latéral" />
            <div className="border-2 border-primary p-4 text-center">
              <p className="font-display text-lg font-bold">Racontez votre histoire</p>
              <p className="mt-1 text-sm text-ink-2">Les membres publient leurs articles, relus par la rédaction.</p>
              <Link href="/publier" className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                Proposer un article
              </Link>
            </div>
            <AlertsBox keywords={["Portraits", "Retour au pays", "Culture"]} />
            <AdSlot label="pavé latéral 2" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

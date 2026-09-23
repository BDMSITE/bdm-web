import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot, KeywordChips } from "@/components/site/chrome";

export const metadata: Metadata = { title: "Aïchatou S. — Membre" };

/* MAQUETTE — Fiche profil membre (CDC §7.5), profil d'exemple. */

const PUBLICATIONS = [
  {
    type: "Article",
    title: "Retour à Cotonou : mon parcours d'ingénieure revenue de Montréal",
    date: "14 septembre 2026",
    href: "/magazine/article-exemple",
  },
  {
    type: "Événement",
    title: "Afterwork BTP & diaspora — Cotonou",
    date: "2 septembre 2026",
    href: "/agenda",
  },
  {
    type: "Offre",
    title: "Ingénieur structures h/f — bureau d'études",
    date: "28 août 2026",
    href: "/emploi",
  },
];

export default function ProfilPage() {
  return (
    <>
      <SiteHeader />

      {/* Bandeau profil */}
      <div className="wax-bg bg-primary-darker py-8 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <nav className="text-xs uppercase tracking-wider text-white/60">
            <Link href="/" className="hover:text-accent">
              Accueil
            </Link>{" "}
            ›{" "}
            <Link href="/communaute/membres" className="hover:text-accent">
              Membres
            </Link>{" "}
            › <span className="text-accent font-bold">Aïchatou S.</span>
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-accent font-display text-4xl font-black text-ink">
              A
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl font-black leading-tight">Aïchatou S.</h1>
              <p className="mt-1 text-sm uppercase tracking-wider text-white/80">
                Cotonou · Bénin — Ingénieure structures, fondatrice de bureau d&apos;études
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["BTP", "Entrepreneuriat", "Retour au pays"].map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"
                  >
                    {s}
                  </span>
                ))}
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-ink">
                  Membre depuis 2026
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <button className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
                Écrire à Aïchatou
              </button>
              <button className="whitespace-nowrap rounded border-2 border-white/60 px-4 py-2 text-sm font-bold hover:border-accent hover:text-accent">
                Suivre
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            {/* À propos */}
            <section>
              <h2 className="section-title text-lg border-b-2 border-line pb-2 mb-4">
                À <em>propos</em>
              </h2>
              <p className="max-w-2xl leading-relaxed text-ink">
                Ingénieure diplômée de Polytechnique Montréal, revenue à Cotonou en 2025 après
                neuf ans au Canada. Je dirige un bureau d&apos;études de six personnes et
                j&apos;accompagne volontiers les membres de la diaspora qui préparent leur retour
                dans le BTP ou l&apos;entrepreneuriat.
              </p>
              <div className="mt-4">
                <KeywordChips
                  keywords={["BTP", "Entrepreneuriat", "Retour au pays", "Cotonou", "Canada"]}
                />
              </div>
            </section>

            {/* Publications */}
            <section>
              <h2 className="section-title text-lg border-b-2 border-line pb-2 mb-4">
                3 contenus <em>publiés</em>
              </h2>
              <ul className="divide-y divide-line border border-line">
                {PUBLICATIONS.map((p) => (
                  <li key={p.title} className="flex items-center gap-4 p-4 hover:bg-primary-faint">
                    <span className="shrink-0 whitespace-nowrap rounded bg-primary-light px-2 py-1 text-xs font-bold uppercase text-primary-dark">
                      {p.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-snug">
                        <Link href={p.href} className="hover:text-primary">
                          {p.title}
                        </Link>
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{p.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Infos visibles selon confidentialité */}
            <section>
              <h2 className="section-title text-lg border-b-2 border-line pb-2 mb-4">
                Parcours <em>professionnel</em>
              </h2>
              <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 max-w-2xl text-sm">
                <div>
                  <dt className="font-bold uppercase text-xs tracking-wider text-muted">
                    Profession
                  </dt>
                  <dd className="mt-0.5">Ingénieure structures — fondatrice</dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-xs tracking-wider text-muted">
                    Formation
                  </dt>
                  <dd className="mt-0.5">Polytechnique Montréal (génie civil)</dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-xs tracking-wider text-muted">
                    Disponibilité
                  </dt>
                  <dd className="mt-0.5">Ouverte aux partenariats et au mentorat</dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-xs tracking-wider text-muted">
                    LinkedIn
                  </dt>
                  <dd className="mt-0.5 text-muted italic">
                    Visible par les membres connectés
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-muted">
                Ce membre choisit ce qui est public, réservé aux membres ou privé. Le contact
                passe par un formulaire relais : son e-mail n&apos;est jamais affiché.
              </p>
            </section>
          </div>

          {/* Colonne latérale */}
          <aside className="space-y-8">
            <div className="border-2 border-primary bg-primary-faint p-4 text-center">
              <p className="font-display text-lg font-bold">Vous aussi, existez ici</p>
              <p className="mt-1 text-sm text-ink-2">
                Créez votre profil gratuit et publiez vos contenus.
              </p>
              <Link
                href="/publier"
                className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark"
              >
                Créer mon profil
              </Link>
            </div>
            <div>
              <h3 className="section-title text-sm border-b-2 border-line pb-2 mb-3">
                Membres <em>similaires</em>
              </h3>
              <ul className="space-y-3 text-sm">
                {[
                  { n: "Rodrigue H.", c: "Bruxelles · Finance" },
                  { n: "Ulrich T.", c: "Cotonou · Éducation" },
                  { n: "Grâce D.", c: "Abidjan · Commerce" },
                ].map((m) => (
                  <li key={m.n} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary-dark">
                      {m.n[0]}
                    </span>
                    <div>
                      <Link
                        href="/communaute/membres"
                        className="font-semibold hover:text-primary"
                      >
                        {m.n}
                      </Link>
                      <p className="card-location">{m.c}</p>
                    </div>
                  </li>
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

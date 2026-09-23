import Link from "next/link";
import type { Metadata } from "next";
import {
  SiteHeader,
  SiteFooter,
  SectionTitle,
  AdSlot,
  AlertsBox,
} from "@/components/site/chrome";

export const metadata: Metadata = { title: "Offres d'emploi & stages" };

/* MAQUETTE — Liste d'offres (CDC §7.3), données d'exemple. */

const OFFRES = [
  {
    title: "Développeur full-stack h/f — fintech en croissance",
    org: "PME Fintech",
    city: "Cotonou · Bénin",
    type: "CDI",
    sector: "Informatique",
    date: "Publié le 14 septembre",
  },
  {
    title: "Chargé(e) de programme santé communautaire",
    org: "ONG Bénin Avenir",
    city: "Parakou · Bénin",
    type: "CDD",
    sector: "Santé / Social",
    date: "Publié le 13 septembre",
  },
  {
    title: "Comptable senior h/f — cabinet international",
    org: "Cabinet d'expertise",
    city: "Abidjan · Côte d'Ivoire",
    type: "CDI",
    sector: "Comptabilité",
    date: "Publié le 12 septembre",
  },
  {
    title: "Stage marketing digital (6 mois, indemnisé)",
    org: "Startup e-commerce",
    city: "Cotonou · Bénin",
    type: "Stage",
    sector: "Marketing",
    date: "Publié le 12 septembre",
  },
  {
    title: "Ingénieur agronome — filière ananas export",
    org: "Coopérative agricole",
    city: "Allada · Bénin",
    type: "CDI",
    sector: "Agriculture",
    date: "Publié le 11 septembre",
  },
  {
    title: "Aide-soignant(e) diplômé(e) — EHPAD",
    org: "Groupe de santé",
    city: "Lyon · France",
    type: "CDI",
    sector: "Santé",
    date: "Publié le 10 septembre",
  },
  {
    title: "Volontariat : appui à la scolarisation des filles",
    org: "Programme national",
    city: "Natitingou · Bénin",
    type: "Volontariat",
    sector: "Éducation",
    date: "Publié le 9 septembre",
  },
];

const FILTRES_TYPE = ["Tous", "CDI", "CDD", "Stage", "Alternance", "Volontariat", "Freelance"];

export default function EmploiPage() {
  return (
    <>
      <SiteHeader />

      {/* Bandeau de rubrique */}
      <div className="wax-bg bg-primary-darker py-8 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="section-title text-2xl md:text-3xl">
            Offres <em className="!text-accent">emploi & stages</em>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Emplois au Bénin et dans la diaspora, stages et volontariat. Publiez une offre
            gratuitement avec un compte entreprise ou association.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/publier"
              className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark"
            >
              Déposer une offre
            </Link>
            <Link
              href="/emploi/recruteurs"
              className="whitespace-nowrap rounded border-2 border-white/60 px-4 py-2 text-sm font-bold text-white hover:border-accent hover:text-accent"
            >
              Espace recruteur
            </Link>
          </div>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="border-b border-line bg-paper-2">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Métier, secteur, entreprise…"
            className="w-full sm:w-64 rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <select className="rounded border border-line bg-paper px-3 py-2 text-sm">
            <option>Tous les pays</option>
            <option>Bénin</option>
            <option>France</option>
            <option>Côte d&apos;Ivoire</option>
            <option>Canada</option>
          </select>
          <select className="rounded border border-line bg-paper px-3 py-2 text-sm">
            <option>Tous les secteurs</option>
            <option>Informatique</option>
            <option>Santé</option>
            <option>Éducation</option>
            <option>Agriculture</option>
          </select>
          <button className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
            Rechercher
          </button>
          <button className="ml-auto text-sm font-bold uppercase text-primary hover:underline">
            Voir sur la carte
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            {/* Filtres par type + compteur */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {FILTRES_TYPE.map((f, i) => (
                <button
                  key={f}
                  className={
                    i === 0
                      ? "rounded-full bg-primary px-3 py-1 text-xs font-bold text-white"
                      : "rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-2 hover:border-primary hover:text-primary"
                  }
                >
                  {f}
                </button>
              ))}
              <span className="ml-auto text-sm text-muted">
                <strong className="text-ink">{OFFRES.length}</strong> offres trouvées
              </span>
            </div>

            {/* Liste des offres */}
            <ul className="space-y-3">
              {OFFRES.map((o) => (
                <li
                  key={o.title}
                  className="border border-line p-4 hover:border-primary hover:bg-primary-faint"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold leading-snug">
                        <Link href="/emploi/offre-exemple" className="hover:text-primary">
                          {o.title}
                        </Link>
                      </h2>
                      <p className="card-location mt-1">
                        {o.org} · {o.city}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {o.sector} — {o.date}
                      </p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded bg-primary-light px-2 py-1 text-xs font-bold text-primary-dark">
                      {o.type}
                    </span>
                    <Link
                      href="/emploi/offre-exemple"
                      className="shrink-0 whitespace-nowrap rounded border-2 border-primary px-3 py-1.5 text-xs font-bold uppercase text-primary hover:bg-primary hover:text-white"
                    >
                      Consulter
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            <button className="mt-6 w-full rounded border-2 border-primary py-2.5 text-sm font-bold uppercase text-primary hover:bg-primary hover:text-white">
              Afficher plus d&apos;offres
            </button>

            {/* Ils recrutent */}
            <section className="mt-12">
              <SectionTitle pre="Ils" em="recrutent" />
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                {["SONEB", "MTN", "ONG BA", "SOBEBRA", "UAC", "PORT"].map((logo) => (
                  <div
                    key={logo}
                    className="flex aspect-square items-center justify-center border border-line bg-paper-2 text-xs font-bold text-muted"
                  >
                    {logo}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Colonne latérale */}
          <aside className="space-y-8">
            <AlertsBox keywords={["Informatique", "Santé", "Cotonou", "France", "Stage"]} />
            <AdSlot label="pavé latéral" />
            <div className="border border-line bg-paper-2 p-4">
              <h3 className="section-title text-sm">
                Devenir <em>partenaire RH</em>
              </h3>
              <p className="mt-2 text-sm text-ink-2">
                Offres illimitées, accès CVthèque, mise en avant de vos recrutements et relais
                newsletter.
              </p>
              <Link
                href="/emploi/recruteurs"
                className="mt-3 inline-block whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline"
              >
                Nous consulter →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

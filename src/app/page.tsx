import Link from "next/link";
import {
  SiteHeader,
  SiteFooter,
  SectionTitle,
  AdSlot,
  AlertsBox,
} from "@/components/site/chrome";

/*
 * MAQUETTE — Accueil (CDC §7.2), données d'exemple uniquement.
 * Ordre des sections calqué sur le modèle : carte dépliable, à la une,
 * emploi, derniers articles, bonnes adresses, avantages, agenda,
 * colonne latérale (pub, alertes, populaire).
 */

const alaUne = [
  {
    title: "Retour à Cotonou : le parcours d'Aïchatou, ingénieure revenue de Montréal",
    cat: "Portrait",
    location: "Cotonou · Bénin",
    href: "/magazine/article-exemple",
  },
  {
    title: "Les secteurs qui recrutent au Bénin en 2026 : le grand dossier",
    cat: "Emploi",
    location: "Bénin",
    href: "/emploi",
  },
  {
    title: "La communauté béninoise de Paris prépare la fête nationale du 1er août",
    cat: "Communauté",
    location: "Paris · France",
    href: "/communaute/membres",
  },
];

const offres = [
  { title: "Développeur full-stack h/f — fintech", org: "PME · Cotonou", type: "CDI" },
  { title: "Chargé(e) de programme santé", org: "ONG · Parakou", type: "CDD" },
  { title: "Comptable senior h/f", org: "Cabinet · Abidjan", type: "CDI" },
  { title: "Stage marketing digital (6 mois)", org: "Startup · Cotonou", type: "Stage" },
];

const articles = [
  { title: "Angélique Kidjo au Zénith : la diaspora en chœur", cat: "Culture" },
  { title: "Investir dans l'immobilier à Cotonou depuis l'étranger : le guide", cat: "Retour au pays" },
  { title: "Étudier au Canada : les bourses ouvertes aux Béninois cette année", cat: "Étudiants" },
  { title: "Le vodun expliqué à mes enfants nés en France", cat: "Mémoire" },
];

const adresses = [
  { name: "Chez Maman Bénin", cat: "Restaurant", city: "PARIS 18e" },
  { name: "Épicerie Dantokpa", cat: "Épicerie", city: "BRUXELLES" },
  { name: "Salon Wax & Co", cat: "Mode", city: "MONTRÉAL" },
];

const avantages = [
  { deal: "-10 % sur les billets Cotonou ↔ Paris", partner: "AGENCE PARTENAIRE" },
  { deal: "Frais réduits sur vos transferts d'argent", partner: "PARTENAIRE TRANSFERT" },
  { deal: "-15 % sur l'hôtel à Ouidah", partner: "HÔTEL PARTENAIRE" },
  { deal: "Pack étudiant : assurance à tarif diaspora", partner: "ASSUREUR PARTENAIRE" },
];

const competences = [
  { name: "Dr Mariam A.", role: "Médecin de santé publique", city: "Montréal · Canada", dispo: "Mentorat" },
  { name: "Jean-Eudes K.", role: "Architecte logiciel", city: "Paris · France", dispo: "À distance" },
  { name: "Nadège G.", role: "Avocate d'affaires", city: "New York · USA", dispo: "Conseil" },
];

const agenda = [
  { title: "Pique-nique des Béninois d'Île-de-France", date: "27 SEPT · 12H00", city: "Paris" },
  { title: "Conférence : investir au Bénin en 2027", date: "4 OCT · 18H30", city: "Bruxelles + visio" },
  { title: "Soirée culturelle Bénin Canada", date: "11 OCT · 20H00", city: "Montréal" },
];

export default function Home() {
  return (
    <>
      <SiteHeader mapDefaultOpen />


      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Colonne principale */}
          <div className="space-y-12">
            {/* À la une */}
            <section>
              <SectionTitle pre="À la" em="une" href="/magazine/article-exemple" />
              <div className="grid gap-5 md:grid-cols-3">
                {alaUne.map((a, i) => (
                  <article
                    key={a.title}
                    className={i === 0 ? "md:col-span-3 md:grid md:grid-cols-2 md:gap-6" : ""}
                  >
                    <div
                      className={`bg-paper-2 border border-line ${
                        i === 0 ? "aspect-video" : "aspect-[4/3]"
                      } mb-3 flex items-center justify-center text-muted text-xs`}
                    >
                      photo
                    </div>
                    <div>
                      <span className="inline-block bg-accent px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink">
                        {a.cat}
                      </span>
                      <h3
                        className={`font-display font-bold leading-snug mt-2 ${
                          i === 0 ? "text-2xl" : "text-base"
                        }`}
                      >
                        <Link href={a.href} className="hover:text-primary">
                          {a.title}
                        </Link>
                      </h3>
                      <p className="card-location mt-2">{a.location}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Emploi */}
            <section>
              <SectionTitle pre="Offres" em="emploi & stages" href="/emploi" />
              <ul className="divide-y divide-line border border-line">
                {offres.map((o) => (
                  <li key={o.title} className="flex items-center gap-4 p-4 hover:bg-primary-faint">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-snug">{o.title}</p>
                      <p className="card-location mt-1">{o.org}</p>
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
                  </li>
                ))}
              </ul>
            </section>

            {/* Derniers articles */}
            <section>
              <SectionTitle pre="Les derniers" em="articles" href="/magazine/article-exemple" />
              <div className="grid gap-5 sm:grid-cols-2">
                {articles.map((a) => (
                  <article key={a.title} className="flex gap-4">
                    <div className="h-20 w-28 shrink-0 border border-line bg-paper-2" />
                    <div>
                      <span className="text-[0.7rem] font-bold uppercase tracking-wider text-primary">
                        {a.cat}
                      </span>
                      <h3 className="mt-1 font-bold leading-snug">
                        <Link href="/magazine/article-exemple" className="hover:text-primary">
                          {a.title}
                        </Link>
                      </h3>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <AdSlot label="pavé milieu" />

            {/* Bonnes adresses */}
            <section>
              <SectionTitle pre="Bonnes" em="adresses" href="/adresses" />
              <div className="grid gap-5 sm:grid-cols-3">
                {adresses.map((a) => (
                  <article key={a.name} className="card-soft border border-line bg-paper">
                    <div className="aspect-[4/3] bg-paper-2" />
                    <div className="p-3">
                      <p className="card-location">{a.city}</p>
                      <h3 className="font-bold leading-snug mt-1">{a.name}</h3>
                      <p className="text-sm text-ink-2">{a.cat}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Avantages */}
            <section>
              <SectionTitle pre="Avantages &" em="réductions" href="/avantages" />
              <div className="grid gap-4 sm:grid-cols-2">
                {avantages.map((a) => (
                  <div
                    key={a.deal}
                    className="flex items-center justify-between gap-3 border-l-4 border-accent bg-accent-light p-4"
                  >
                    <div>
                      <p className="font-bold leading-snug">{a.deal}</p>
                      <p className="card-location mt-1">{a.partner}</p>
                    </div>
                    <Link
                      href="/avantages"
                      className="shrink-0 text-xs font-bold uppercase text-primary hover:underline"
                    >
                      Consulter
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* Compétences de la diaspora */}
            <section>
              <SectionTitle pre="Compétences de la" em="diaspora" href="/communaute/competences" />
              <div className="grid gap-4 sm:grid-cols-3">
                {competences.map((c) => (
                  <article key={c.name} className="card-soft border border-line bg-paper p-4">
                    <p className="font-bold leading-tight">{c.name}</p>
                    <p className="text-sm text-ink-2">{c.role}</p>
                    <p className="card-location mt-1">{c.city}</p>
                    <span className="mt-2 inline-block rounded-full bg-primary-light px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-primary-dark">
                      {c.dispo}
                    </span>
                  </article>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">
                87 experts de la diaspora mobilisables pour des projets au Bénin — une initiative HCBE.
              </p>
            </section>

            {/* Agenda */}
            <section>
              <SectionTitle pre="Événements" em="à venir" href="/agenda" />
              <ul className="space-y-3">
                {agenda.map((e) => (
                  <li key={e.title} className="card-soft flex items-center gap-4 border border-line bg-paper p-4">
                    <span className="shrink-0 rounded bg-primary px-3 py-2 text-center text-xs font-bold uppercase leading-tight text-white">
                      {e.date}
                    </span>
                    <div>
                      <p className="font-bold leading-snug">{e.title}</p>
                      <p className="card-location mt-1">{e.city}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Colonne latérale */}
          <aside className="space-y-8">
            <AdSlot label="pavé latéral" />
            <AlertsBox keywords={["Emploi", "Paris", "Retour au pays", "Informatique", "Étudiants"]} />
            <div>
              <h3 className="section-title text-sm border-b-2 border-line pb-2 mb-3">
                Populaire <em>sur le site</em>
              </h3>
              <ol className="space-y-3 text-sm">
                {articles.slice(0, 3).map((a, i) => (
                  <li key={a.title} className="flex gap-3">
                    <span className="font-display text-2xl font-black text-line leading-none">
                      {i + 1}
                    </span>
                    <Link
                      href="/magazine/article-exemple"
                      className="font-semibold leading-snug hover:text-primary"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
            <AdSlot label="pavé latéral 2" />
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter, PageBanner } from "@/components/site/chrome";

/* Pages légales : squelette structuré (sections obligatoires) à compléter par
   le HCBE et son conseil juridique. Aucune raison sociale, immatriculation,
   adresse ou date inventée. Seuls les prestataires techniques réels sont nommés. */

type Section = { title: string; known?: React.ReactNode; todo: string };

const PAGES: Record<string, { title: string; em: string; intro: string; sections: Section[] }> = {
  "mentions-legales": {
    title: "Mentions",
    em: "légales",
    intro: "Identité de l'éditeur, hébergement et responsabilités.",
    sections: [
      {
        title: "Éditeur du site",
        known: <>Le site Béninois du Monde est édité par le Haut Conseil des Béninois de l&apos;Extérieur (HCBE).</>,
        todo: "Forme juridique, siège social, immatriculation et coordonnées officielles du HCBE.",
      },
      { title: "Directeur de la publication", todo: "Nom et qualité du directeur de la publication." },
      {
        title: "Hébergement",
        known: <>Le site est hébergé par Vercel Inc. (États-Unis). La base de données est hébergée par Neon.</>,
        todo: "Coordonnées complètes des hébergeurs, région d'hébergement retenue et, le cas échéant, hébergeur des pièces jointes.",
      },
      { title: "Propriété intellectuelle", todo: "Conditions de réutilisation des contenus du site, des contributions des membres et des photos (crédits)." },
      { title: "Responsabilité éditoriale et modération", todo: "Règles de modération, délais de traitement des signalements, contact pour un retrait." },
      { title: "Droit applicable", todo: "Droit applicable et juridiction compétente." },
    ],
  },
  confidentialite: {
    title: "Politique de",
    em: "confidentialité",
    intro: "Quelles données sont collectées, pourquoi, combien de temps, et vos droits.",
    sections: [
      {
        title: "Données collectées",
        known: <>À l&apos;inscription : nom, prénom, e-mail, pays, ville, secteur d&apos;activité, mot de passe (stocké chiffré). Sur le profil, selon ce que vous choisissez de renseigner : fonction, biographie, site web, CV, mots-clés. Pour les comptes importés par le HCBE : téléphone (jamais affiché).</>,
        todo: "Liste définitive des données et des sources, validée par le HCBE.",
      },
      { title: "Finalités et bases légales", todo: "Finalités (gestion des comptes, annuaire, alertes e-mail, newsletter, mesure d'audience) et base légale de chacune." },
      {
        title: "Visibilité choisie par le membre",
        known: <>Chaque membre choisit s&apos;il apparaît dans l&apos;annuaire public. L&apos;adresse e-mail n&apos;est jamais affichée : tout contact passe par un formulaire relais.</>,
        todo: "Détail des réglages de visibilité par champ.",
      },
      { title: "Durées de conservation", todo: "Durées de conservation des comptes, des contenus, des candidatures et des messages." },
      { title: "Vos droits (APDP / RGPD)", todo: "Modalités d'exercice des droits d'accès, de rectification, d'effacement et d'opposition ; autorité de contrôle compétente." },
      { title: "Cookies et mesure d'audience", todo: "Liste des cookies et traceurs utilisés, et outil de mesure d'audience retenu." },
      {
        title: "Contact données personnelles",
        known: <>Pour toute demande relative à vos données, utilisez le <Link href="/contact" className="font-bold text-primary hover:underline">formulaire de contact</Link> (sujet « Données personnelles »).</>,
        todo: "Identité du responsable de traitement et, le cas échéant, du délégué à la protection des données.",
      },
    ],
  },
  cgu: {
    title: "CGU & charte de",
    em: "publication",
    intro: "Règles d'utilisation du site, de publication et de modération.",
    sections: [
      {
        title: "Inscription et comptes",
        known: <>L&apos;inscription est gratuite et ouverte aux particuliers, entreprises, associations et artistes. Elle nécessite une adresse e-mail confirmée.</>,
        todo: "Conditions d'âge, règles sur les comptes multiples et la véracité des informations.",
      },
      {
        title: "Règles de publication",
        known: <>Tout contenu déposé par un membre est relu par la modération avant mise en ligne. Les coordonnées personnelles ne doivent pas figurer dans les textes : le contact passe par le formulaire relais.</>,
        todo: "Charte détaillée : contenus interdits, exigences de localisation et de mots-clés, droits sur les contenus publiés.",
      },
      { title: "Modération et signalements", todo: "Procédure de signalement, délais, recours." },
      { title: "Petites annonces et mises en relation", todo: "Règles propres aux annonces et aux mises en relation ; responsabilité des membres ; rappel que le site ne demande jamais d'argent pour une mise en relation." },
      { title: "Comptes professionnels", todo: "Conditions applicables aux comptes entreprise, association et artiste (validation, offres d'emploi, contenus promotionnels)." },
      { title: "Suspension et bannissement", todo: "Motifs et procédure de suspension ou de suppression d'un compte." },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  return { title: page ? `${page.title} ${page.em}` : "Page légale" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  return (
    <>
      <SiteHeader />
      <PageBanner pre={page.title} em={page.em} desc={page.intro} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="max-w-2xl space-y-8">
          <p className="border-l-4 border-accent bg-accent-light p-4 text-sm">
            <strong>Document en cours de rédaction.</strong> Le texte définitif est préparé par le HCBE et son conseil juridique.
            Les sections ci-dessous indiquent ce qui est déjà en vigueur sur le site et ce qui reste à compléter.
          </p>
          {page.sections.map((s, i) => (
            <section key={s.title}>
              <h2 className="section-title text-lg">{i + 1}. {s.title}</h2>
              {s.known && <p className="mt-2 text-sm leading-relaxed text-ink">{s.known}</p>}
              <div className="mt-3 border border-dashed border-line bg-paper-2 p-3 text-sm text-ink-2">
                <span className="font-bold text-ink">À compléter par le HCBE : </span>{s.todo}
              </div>
            </section>
          ))}
          <nav className="flex flex-wrap gap-4 border-t border-line pt-4 text-sm font-bold text-primary">
            {Object.entries(PAGES).filter(([k]) => k !== slug).map(([k, v]) => (
              <Link key={k} href={`/legal/${k}`} className="hover:underline">{v.title} {v.em} →</Link>
            ))}
          </nav>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

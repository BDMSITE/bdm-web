import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter, PageBanner } from "@/components/site/chrome";
import charte from "@/content/charte-communaute.json";

/* Pages légales — version 1 rédigée par le prestataire à partir du
   fonctionnement réel du site, à valider par le HCBE et son conseil juridique.
   Identité du HCBE : uniquement des faits publiés par le HCBE lui-même
   (hcbe-monde.org) ou recoupés par deux sources ; pas de numéro de décret
   (sources divergentes), pas de nom tant que le HCBE ne l'a pas confirmé. */

type Bloc = { h?: string; p?: string[]; li?: string[]; todo?: string };

const PAGES: Record<string, { title: string; em: string; intro: string; blocs: Bloc[] }> = {
  "mentions-legales": {
    title: "Mentions",
    em: "légales",
    intro: "Qui édite le site, qui l'héberge, quelles responsabilités.",
    blocs: [
      { h: "1. Éditeur du site", p: [
        "Le site Béninois du Monde est édité par le Haut Conseil des Béninois de l'Extérieur (HCBE), association apolitique, laïque et à but non lucratif reconnue d'utilité publique par l'État béninois, qui fédère et représente les Béninois vivant hors du Bénin.",
        "Créé à Cotonou en décembre 1997 à l'initiative des communautés béninoises de l'extérieur, le HCBE est enregistré sous le n° 2000/399/MISAT/DC/SG/DAI/SAAP-Assoc du 6 novembre 2000. Siège social : Cotonou, République du Bénin. Site institutionnel : hcbe-monde.org.",
        "Pour joindre l'éditeur, utilisez le formulaire de contact du site : aucune adresse e-mail n'est publiée afin de limiter le démarchage et les usurpations.",
      ] },
      { h: "2. Directeur de la publication", p: ["Le directeur de la publication est le Président du Bureau exécutif mondial du HCBE, en exercice à la date de consultation. La rédaction et la modération agissent sous son autorité."] },
      { h: "3. Réalisation technique", p: ["Conception et développement : JOJO.DEV's. Le code du site est maintenu par le prestataire pour le compte du HCBE."] },
      { h: "4. Hébergement", p: ["Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com). La base de données est hébergée par Neon Inc. (neon.com), région États-Unis. Les e-mails transactionnels sont envoyés par un prestataire d'envoi d'e-mails (Brevo, Paris, France) dès sa mise en service."] },
      { h: "5. Propriété intellectuelle", p: ["La structure du site, sa charte graphique et les contenus produits par la rédaction sont la propriété du HCBE. Les contenus publiés par les membres (articles, offres, événements, annonces, photos) restent la propriété de leurs auteurs, qui accordent au HCBE une licence non exclusive de diffusion sur le site et dans ses lettres d'information. Toute reproduction à des fins commerciales sans accord écrit est interdite. Les photos doivent être libres de droits ou accompagnées de leur crédit."] },
      { h: "6. Responsabilité éditoriale et modération", p: ["Les contenus proposés par les membres sont relus par la modération avant mise en ligne. Le HCBE peut refuser, modifier ou retirer un contenu contraire à la Charte de la communauté ou à la loi. Tout contenu peut être signalé depuis le site ; les signalements sont traités dans les meilleurs délais. Les informations publiées par les membres (offres, adresses, annonces) relèvent de leur responsabilité : le HCBE ne garantit pas leur exactitude et n'est pas partie aux relations qui en découlent."] },
      { h: "7. Liens et contenus tiers", p: ["Le site peut renvoyer vers des sites tiers. Le HCBE n'exerce aucun contrôle sur leur contenu et décline toute responsabilité à leur égard."] },
      { h: "8. Droit applicable", p: ["Le site est régi par le droit de la République du Bénin. Les membres résidant dans l'Union européenne bénéficient en outre des droits prévus par le Règlement général sur la protection des données (RGPD).", "En cas de litige, et après recherche d'une solution amiable par le formulaire de contact, les juridictions compétentes sont celles de Cotonou (République du Bénin), sans préjudice des règles impératives protégeant les consommateurs dans leur pays de résidence."] },
    ],
  },
  confidentialite: {
    title: "Politique de",
    em: "confidentialité",
    intro: "Quelles données nous collectons, pourquoi, combien de temps, et vos droits.",
    blocs: [
      { h: "1. Responsable du traitement", p: ["Le responsable du traitement des données collectées sur le site est le Haut Conseil des Béninois de l'Extérieur (HCBE), association reconnue d'utilité publique dont le siège est à Cotonou (République du Bénin).", "Pour toute question ou pour exercer vos droits, écrivez-nous par le formulaire de contact en choisissant le sujet « Données personnelles » : la demande est transmise au responsable du traitement, qui répond dans un délai d'un mois. Aucun délégué à la protection des données n'a été désigné à ce jour."] },
      { h: "2. Données collectées", li: [
        "Compte : adresse e-mail, mot de passe (stocké haché, jamais en clair), nom, ce que vous représentez (particulier, entreprise, association, artiste), dates de création et de connexion.",
        "Profil public : nom affiché, ville, pays, fonction, biographie, site web, mots-clés, CV (lien) — chaque membre choisit ce qui apparaît dans l'annuaire.",
        "Données privées du profil : numéro de téléphone (jamais affiché), préférences d'alertes.",
        "Contenus publiés : articles, offres, événements, adresses, annonces, candidatures, messages envoyés par formulaire relais.",
        "Données techniques : journaux de connexion et d'administration (date, action), nécessaires à la sécurité du service.",
        "Newsletter : adresse e-mail et segments d'abonnement.",
      ] },
      { h: "3. Finalités et bases légales", li: [
        "Gérer votre compte et votre espace membre — exécution du service demandé.",
        "Publier votre profil dans l'annuaire et vos contenus sur le site — votre consentement, modifiable à tout moment depuis votre profil.",
        "Vous envoyer les e-mails d'activation, de connexion et les notifications liées à vos actions — exécution du service.",
        "Vous envoyer les alertes par mots-clés et la lettre d'information — votre consentement, avec désabonnement à chaque envoi.",
        "Mettre en relation les membres sans exposer leur adresse e-mail (formulaire relais) — exécution du service.",
        "Assurer la sécurité du site et tracer les actions d'administration — intérêt légitime.",
      ] },
      { h: "4. Durées de conservation", li: [
        "Compte et profil : tant que le compte est actif, puis anonymisation à la suppression du compte.",
        "Contenus publiés : tant qu'ils sont en ligne ; les contenus retirés sont archivés 12 mois puis supprimés.",
        "Comptes importés jamais activés : 12 mois après la dernière invitation, puis suppression.",
        "Journaux de sécurité et d'administration : 12 mois.",
        "Abonnement à la lettre d'information : jusqu'au désabonnement.",
      ] },
      { h: "5. Destinataires et sous-traitants", p: ["Les données sont traitées par le HCBE et ses prestataires techniques, uniquement pour les finalités ci-dessus : Vercel (hébergement du site, États-Unis), Neon (base de données, États-Unis), prestataire d'envoi d'e-mails (Brevo, France). Aucune donnée n'est vendue ni cédée à des tiers. Les adresses e-mail des membres ne sont jamais affichées sur le site."] },
      { h: "6. Transferts hors de l'Union européenne", p: ["L'hébergement du site et de la base de données est situé aux États-Unis. Pour les membres résidant dans l'Union européenne, ces transferts sont encadrés par les clauses contractuelles types des prestataires."] },
      { h: "7. Vos droits", p: ["Vous pouvez à tout moment : accéder à vos données et les télécharger (Mon espace → Mes données → Télécharger mes données), les rectifier (Mon profil), limiter leur visibilité (champ par champ), retirer votre consentement (alertes, newsletter, annuaire) et supprimer votre compte (Mon espace → Mes données). Vous pouvez aussi exercer vos droits par le formulaire de contact. Les membres de l'Union européenne peuvent saisir leur autorité de contrôle ; au Bénin, l'autorité compétente est l'APDP (Autorité de protection des données personnelles)."] },
      { h: "8. Cookies", p: ["Le site utilise uniquement des cookies strictement nécessaires au fonctionnement (session de connexion, sécurité). Aucun cookie publicitaire ni de suivi tiers n'est déposé. Si un outil de mesure d'audience respectueux de la vie privée est ajouté, cette politique sera mise à jour."] },
      { h: "9. Sécurité", p: ["Mots de passe hachés (Argon2), connexions chiffrées (HTTPS), accès au back-office limité aux rôles habilités et journalisé, e-mails jamais exposés publiquement."] },
    ],
  },
  cgu: {
    title: "Conditions d'utilisation &",
    em: "charte",
    intro: "Les règles d'usage du site et la Charte de la communauté du HCBE.",
    blocs: [
      { h: "1. Objet", p: ["Béninois du Monde est un portail d'information et de mise en réseau des Béninois de l'extérieur, des Béninois du pays et des afrodescendants, édité par le HCBE. L'inscription et l'usage des services sont gratuits ; certaines fonctions réservées aux partenaires (régie publicitaire, offres d'emploi payantes) feront l'objet de conditions spécifiques communiquées sur demande."] },
      { h: "2. Compte", p: ["Un compte est personnel et correspond à une adresse e-mail. L'activation se fait par le lien reçu à cette adresse. Vous êtes responsable de la confidentialité de vos identifiants. Il n'existe qu'un type de compte, le compte membre ; le membre indique dans son profil s'il représente une entreprise, une association ou un artiste. Le HCBE peut suspendre un compte en cas de manquement à la présente charte."] },
      { h: "3. Publication de contenus", p: ["Tout contenu proposé (article, offre, événement, adresse, annonce, demande d'entraide) est relu par la modération avant mise en ligne. Vous garantissez détenir les droits sur ce que vous publiez (textes, photos) et l'exactitude des informations pratiques (offres, adresses). Sont interdits : contenus illicites, discriminatoires, diffamatoires, trompeurs, publicités déguisées, collecte de données personnelles, contenus sans rapport avec l'objet du site."] },
      { h: "4. Relations entre membres", p: ["Les mises en relation passent par le formulaire relais du site : aucune adresse e-mail n'est communiquée sans votre accord. Le HCBE n'intervient pas dans les relations commerciales, d'emploi ou de logement conclues entre membres et ne saurait en être tenu responsable."] },
      { h: "5. Signalement et retrait", p: ["Tout membre peut signaler un contenu ou un profil. Le HCBE peut retirer un contenu, suspendre ou supprimer un compte, sans préavis en cas d'atteinte grave. Un contenu retiré peut être contesté par le formulaire de contact."] },
      { h: "6. Données personnelles", p: ["Le traitement de vos données est décrit dans la Politique de confidentialité, qui fait partie des présentes conditions."] },
      { h: "7. Évolution des conditions", p: ["Les présentes conditions peuvent évoluer ; la date de dernière mise à jour figure en bas de page et les membres sont informés par e-mail des changements substantiels."] },
      { h: charte.title, p: [`Texte adopté par le HCBE et publié sur l'ancien site (mise à jour du ${new Date(charte.modified).toLocaleDateString("fr-FR")}). Il fait partie intégrante des conditions d'utilisation.`] },
      ...charte.blocks.reduce<Bloc[]>((acc, b) => {
        if (b.type === "h") acc.push({ h: b.text });
        else if (b.type === "li") { const last = acc[acc.length - 1]; if (last && last.li) last.li.push(b.text); else acc.push({ li: [b.text] }); }
        else acc.push({ p: [b.text] });
        return acc;
      }, []),
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = PAGES[(await params).slug];
  return { title: page ? `${page.title} ${page.em}` : "Page introuvable" };
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
        <div className="max-w-2xl space-y-6">
          <p className="border-l-4 border-accent bg-accent-light p-4 text-sm">
            <strong>Version 1 du 20 octobre 2026</strong> — rédigée à partir du fonctionnement réel du site, en cours de validation par le HCBE et son conseil juridique.
          </p>
          {page.blocs.map((b, i) => (
            <section key={i}>
              {b.h && <h2 className="section-title mt-8 text-lg">{b.h}</h2>}
              {b.p?.map((t, j) => <p key={j} className="mt-2 text-sm leading-relaxed text-ink">{t}</p>)}
              {b.li && (
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink">
                  {b.li.map((t, j) => <li key={j}>{t}</li>)}
                </ul>
              )}
              {b.todo && (
                <div className="mt-3 border border-dashed border-line bg-paper-2 p-3 text-sm text-ink-2">
                  <span className="font-bold text-ink">À compléter par le HCBE : </span>{b.todo}
                </div>
              )}
            </section>
          ))}
          <nav className="flex flex-wrap gap-4 border-t border-line pt-4 text-sm font-bold text-primary">
            {Object.entries(PAGES).filter(([k]) => k !== slug).map(([k, v]) => (
              <Link key={k} href={`/legal/${k}`} className="hover:underline">{v.title} {v.em} →</Link>
            ))}
            <Link href="/contact" className="hover:underline">Contact →</Link>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

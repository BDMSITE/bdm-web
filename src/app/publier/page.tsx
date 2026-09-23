import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot } from "@/components/site/chrome";
import { PenLine, Briefcase, GraduationCap, CalendarDays, Megaphone, MapPin } from "lucide-react";

export const metadata: Metadata = { title: "Publier sur Béninois du Monde" };

/* MAQUETTE — Guichet « Publier » (CDC §7.1), formulaire d'exemple non branché. */

const TYPES = [
  {
    key: "article",
    label: "Un article",
    desc: "Votre parcours, un portrait, une actu de votre communauté",
    icon: PenLine,
    active: false,
  },
  {
    key: "offre",
    label: "Une offre d'emploi",
    desc: "CDI, CDD, mission — 3 offres tests gratuites",
    icon: Briefcase,
    active: true,
  },
  {
    key: "stage",
    label: "Un stage / volontariat",
    desc: "Toujours gratuit pour les structures",
    icon: GraduationCap,
    active: false,
  },
  {
    key: "evenement",
    label: "Un événement",
    desc: "Soirée, conférence, pique-nique, concert",
    icon: CalendarDays,
    active: false,
  },
  {
    key: "annonce",
    label: "Une petite annonce",
    desc: "Logement, covoiturage, services, bonnes affaires",
    icon: Megaphone,
    active: false,
  },
  {
    key: "adresse",
    label: "Une bonne adresse",
    desc: "Restaurant, commerce, service béninois près de chez vous",
    icon: MapPin,
    active: false,
  },
];

const ETAPES = ["1. Je choisis", "2. Je remplis", "3. Modération", "4. En ligne + alertes"];

export default function PublierPage() {
  return (
    <>
      <SiteHeader />

      <div className="wax-bg bg-primary-darker py-8 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="section-title text-2xl md:text-3xl">
            Publier sur <em className="!text-accent">Béninois du Monde</em>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Membres, entreprises, associations et artistes publient directement. La rédaction
            valide, puis votre contenu part dans les alertes e-mail et sur les réseaux.
          </p>
          <ol className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
            {ETAPES.map((e, i) => (
              <li
                key={e}
                className={`rounded px-3 py-1.5 ${
                  i <= 1 ? "bg-accent text-ink" : "bg-white/10 text-white/70"
                }`}
              >
                {e}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            {/* Étape 1 : choix du type */}
            <h2 className="section-title text-lg border-b-2 border-line pb-2 mb-5">
              Que voulez-vous <em>publier ?</em>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  className={`border p-4 text-left ${
                    t.active
                      ? "border-2 border-primary bg-primary-faint"
                      : "border-line hover:border-primary"
                  }`}
                  aria-pressed={t.active}
                >
                  <t.icon aria-hidden className="h-7 w-7 text-primary" strokeWidth={2.2} />
                  <span className="mt-2 block font-bold">{t.label}</span>
                  <span className="mt-1 block text-sm text-ink-2">{t.desc}</span>
                </button>
              ))}
            </div>

            {/* Étape 2 : formulaire (exemple : offre d'emploi) */}
            <h2 className="section-title text-lg border-b-2 border-line pb-2 mt-10 mb-5">
              Votre offre <em>d&apos;emploi</em>
            </h2>
            <form className="space-y-5 border border-line p-5">
              <div>
                <label htmlFor="titre" className="mb-1 block text-sm font-bold">
                  Titre de l&apos;offre *
                </label>
                <input
                  id="titre"
                  defaultValue="Développeur full-stack h/f — fintech en croissance"
                  className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contrat" className="mb-1 block text-sm font-bold">
                    Type de contrat *
                  </label>
                  <select
                    id="contrat"
                    className="w-full rounded border border-line bg-paper px-3 py-2 text-sm"
                  >
                    <option>CDI</option>
                    <option>CDD</option>
                    <option>Stage</option>
                    <option>Alternance</option>
                    <option>Volontariat</option>
                    <option>Freelance / mission</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="secteur" className="mb-1 block text-sm font-bold">
                    Secteur *
                  </label>
                  <select
                    id="secteur"
                    className="w-full rounded border border-line bg-paper px-3 py-2 text-sm"
                  >
                    <option>Informatique</option>
                    <option>Santé</option>
                    <option>Finance</option>
                    <option>Éducation</option>
                    <option>BTP</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pays" className="mb-1 block text-sm font-bold">
                    Pays *
                  </label>
                  <select
                    id="pays"
                    className="w-full rounded border border-line bg-paper px-3 py-2 text-sm"
                  >
                    <option>Bénin</option>
                    <option>France</option>
                    <option>Canada</option>
                    <option>Côte d&apos;Ivoire</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ville" className="mb-1 block text-sm font-bold">
                    Ville *
                  </label>
                  <input
                    id="ville"
                    defaultValue="Cotonou"
                    className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-muted">
                    La ville place votre offre sur la carte et dans les alertes locales.
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="mb-1 block text-sm font-bold">
                  Description du poste *
                </label>
                <textarea
                  id="description"
                  rows={5}
                  className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  defaultValue="Missions, profil recherché, avantages…"
                />
              </div>

              <div>
                <span className="mb-1 block text-sm font-bold">Mots-clés</span>
                <div className="flex flex-wrap items-center gap-2">
                  {["Informatique", "Cotonou", "CDI"].map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark"
                    >
                      {k} ✕
                    </span>
                  ))}
                  <input
                    aria-label="Ajouter un mot-clé"
                    placeholder="Ajouter…"
                    className="w-28 rounded border border-line bg-paper px-2 py-1 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-muted">
                  Les mots-clés déclenchent les alertes e-mail des membres abonnés.
                </p>
              </div>

              <div>
                <label htmlFor="candidature" className="mb-1 block text-sm font-bold">
                  Comment postuler ? *
                </label>
                <select
                  id="candidature"
                  className="w-full rounded border border-line bg-paper px-3 py-2 text-sm sm:w-1/2"
                >
                  <option>Formulaire avec CV sur le site</option>
                  <option>Lien externe</option>
                  <option>E-mail relais (votre adresse reste cachée)</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
                <button
                  type="button"
                  className="rounded bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
                >
                  Soumettre à la modération
                </button>
                <button
                  type="button"
                  className="rounded border-2 border-primary px-5 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white"
                >
                  Prévisualiser
                </button>
                <button
                  type="button"
                  className="text-sm font-semibold text-ink-2 hover:text-primary"
                >
                  Enregistrer le brouillon
                </button>
                <span className="ml-auto text-xs text-muted">
                  Offres tests restantes : <strong className="text-ink">2/3</strong>
                </span>
              </div>
            </form>
          </div>

          {/* Colonne latérale */}
          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">
                Comment ça <em>marche ?</em>
              </h3>
              <ol className="mt-3 space-y-2 text-sm text-ink-2">
                <li>1. Vous publiez depuis votre compte gratuit.</li>
                <li>2. La modération valide sous 48 h ouvrées.</li>
                <li>3. Votre contenu part dans les alertes e-mail et sur nos réseaux.</li>
                <li>4. Vous suivez les vues et réponses dans votre espace.</li>
              </ol>
            </div>
            <div className="border border-line bg-paper-2 p-4">
              <h3 className="section-title text-sm">
                Besoin de plus de <em>3 offres ?</em>
              </h3>
              <p className="mt-2 text-sm text-ink-2">
                Devenez partenaire RH : offres illimitées, CVthèque et mise en avant.
              </p>
              <Link
                href="/emploi/recruteurs"
                className="mt-3 inline-block whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline"
              >
                Découvrir →
              </Link>
            </div>
            <AdSlot label="pavé latéral" />
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

"use client";

import { useActionState, useState } from "react";
import { PenLine, Briefcase, GraduationCap, CalendarDays, MapPin, Megaphone, HeartHandshake } from "lucide-react";
import { publishAction, type PublishState } from "@/lib/actions/publier";
import { TimezoneSelect } from "@/components/site/timezone-select";
import { LieuFields } from "@/components/site/lieu-fields";

/* Formulaire du guichet « Publier » : type, champs communs, champs selon le type.
   Tout contenu part en modération ; rien n'est mis en ligne directement. */

const TYPES = [
  { value: "MEMBER_ARTICLE", icon: PenLine, t: "Un article", d: "Votre parcours, un portrait, une actualité de votre communauté." },
  { value: "JOB", icon: Briefcase, t: "Une offre d'emploi", d: "CDI, CDD, mission, freelance." },
  { value: "INTERNSHIP", icon: GraduationCap, t: "Un stage / volontariat", d: "Stage, alternance, volontariat." },
  { value: "EVENT", icon: CalendarDays, t: "Un événement", d: "Conférence, soirée, concert, rencontre." },
  { value: "PLACE", icon: MapPin, t: "Une bonne adresse", d: "Restaurant, commerce, service béninois près de chez vous." },
  { value: "CLASSIFIED", icon: Megaphone, t: "Une petite annonce", d: "Logement, covoiturage, services, bonnes affaires." },
  { value: "HELP_REQUEST", icon: HeartHandshake, t: "Chercher / trouver", d: "Une demande d'aide ou de mise en relation." },
] as const;

type PublishType = (typeof TYPES)[number]["value"];

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none aria-[invalid=true]:border-danger";

export function PublierForm() {
  const [state, action, pending] = useActionState<PublishState, FormData>(publishAction, {});
  const [type, setType] = useState<PublishType>("MEMBER_ARTICLE");
  const invalid = (champ: string) => (state.champ === champ ? true : undefined);

  const isJob = type === "JOB" || type === "INTERNSHIP";

  return (
    <form action={action} noValidate>
      <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">
        1. Que voulez-vous <em>publier ?</em>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {TYPES.map((t) => (
          <label key={t.value} className="cursor-pointer">
            <input
              type="radio"
              name="type"
              value={t.value}
              checked={type === t.value}
              onChange={() => setType(t.value)}
              className="peer sr-only"
            />
            <span className="flex h-full flex-col border border-line p-4 text-left hover:border-primary peer-checked:border-2 peer-checked:border-primary peer-checked:bg-primary-faint peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
              <t.icon aria-hidden className="h-7 w-7 text-primary" strokeWidth={2.2} />
              <span className="mt-2 block font-bold">{t.t}</span>
              <span className="mt-1 block text-sm text-ink-2">{t.d}</span>
            </span>
          </label>
        ))}
      </div>

      <h2 className="section-title mb-4 mt-10 border-b-2 border-line pb-2 text-lg">
        2. Votre <em>contenu</em>
      </h2>
      <div className="space-y-5 border border-line p-5">
        {state.error && (
          <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">
            {state.error}
          </p>
        )}

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-bold">Titre *</label>
          <input id="title" name="title" required maxLength={160} aria-invalid={invalid("title")} className={INPUT} />
        </div>

        <div>
          <label htmlFor="excerpt" className="mb-1 block text-sm font-bold">Chapô <span className="font-normal text-muted">(résumé en une ou deux phrases)</span></label>
          <input id="excerpt" name="excerpt" maxLength={300} aria-invalid={invalid("excerpt")} className={INPUT} />
        </div>

        <div>
          <label htmlFor="body" className="mb-1 block text-sm font-bold">Texte *</label>
          <textarea id="body" name="body" rows={8} required aria-invalid={invalid("body")} className={INPUT} />
          <p className="mt-1 text-xs text-muted">Pas de coordonnées personnelles dans le texte : le contact passe par le formulaire relais du site.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <LieuFields required countryInvalid={invalid("country")} cityInvalid={invalid("city")} cityHint="La ville place votre contenu sur la carte et dans les alertes locales." inputClass={INPUT} />
        </div>

        <div>
          <label htmlFor="keywords" className="mb-1 block text-sm font-bold">Mots-clés <span className="font-normal text-muted">(séparés par des virgules)</span></label>
          <input id="keywords" name="keywords" placeholder="Ex. : informatique, Cotonou, retour au pays" maxLength={500} className={INPUT} />
          <p className="mt-1 text-xs text-muted">Les mots-clés déclenchent les alertes e-mail des membres abonnés.</p>
        </div>

        {isJob && (
          <div className="border-t border-line pt-5">
            <label htmlFor="contractType" className="mb-1 block text-sm font-bold">Type de contrat *</label>
            <select id="contractType" name="contractType" aria-invalid={invalid("contractType")} className={`${INPUT} sm:w-1/2`}>
              {(type === "JOB" ? ["CDI", "CDD", "Mission", "Freelance"] : ["Stage", "Alternance", "Volontariat"]).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">Les candidatures arrivent par le formulaire du site, votre adresse e-mail reste cachée.</p>
          </div>
        )}

        {type === "EVENT" && (
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <div>
              <label htmlFor="startsAt" className="mb-1 block text-sm font-bold">Date et heure (heure du lieu) *</label>
              <input id="startsAt" name="startsAt" type="datetime-local" aria-invalid={invalid("startsAt")} className={INPUT} />
            </div>
            <div>
              <label htmlFor="timezone" className="mb-1 block text-sm font-bold">Fuseau horaire du lieu</label>
              <TimezoneSelect className={INPUT} />
              <p className="mt-1 text-xs text-muted">Préréglé sur votre fuseau. Le site affiche aussi l&apos;heure de Cotonou.</p>
            </div>
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-bold">Catégorie</label>
              <select id="category" name="category" className={INPUT}>
                {["Conférence", "Soirée", "Concert", "Rencontre", "Formation", "Sport", "Religieux", "Autre"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="venue" className="mb-1 block text-sm font-bold">Lieu</label>
              <input id="venue" name="venue" placeholder="Salle, adresse…" aria-invalid={invalid("venue")} className={INPUT} />
            </div>
            <label className="flex items-center gap-2.5 self-end pb-2 text-sm">
              <input type="checkbox" name="isOnline" className="h-4 w-4 accent-primary" />
              Événement en ligne
            </label>
          </div>
        )}

        {type === "PLACE" && (
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-bold">Catégorie *</label>
              <select id="category" name="category" aria-invalid={invalid("category")} className={INPUT}>
                {["Restaurant", "Commerce", "Service", "Coiffure & beauté", "Association", "Lieu de culte", "Autre"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="address" className="mb-1 block text-sm font-bold">Adresse</label>
              <input id="address" name="address" autoComplete="street-address" className={INPUT} />
            </div>
          </div>
        )}

        {type === "CLASSIFIED" && (
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-bold">Catégorie *</label>
              <select id="category" name="category" aria-invalid={invalid("category")} className={INPUT}>
                {["Logement", "Colocation", "Covoiturage", "Services", "Bonnes affaires", "Auto-moto", "Autre"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="price" className="mb-1 block text-sm font-bold">Prix <span className="font-normal text-muted">(facultatif)</span></label>
              <input id="price" name="price" placeholder="Ex. : 350 € / mois" className={INPUT} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
          <button
            type="submit"
            disabled={pending}
            className="whitespace-nowrap rounded bg-primary px-6 py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {pending ? "Envoi…" : "Soumettre à la modération"}
          </button>
          <span className="text-sm text-ink-2">Votre contenu sera relu par la modération avant mise en ligne.</span>
        </div>
      </div>
    </form>
  );
}

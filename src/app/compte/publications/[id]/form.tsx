"use client";

import { useActionState, useState } from "react";
import { TimezoneSelect } from "@/components/site/timezone-select";
import { LieuFields } from "@/components/site/lieu-fields";
import type { ContentStatus, ContentType } from "@prisma/client";
import { updateContentAction, withdrawContentAction, republishContentAction, resolveHelpAction, type PublicationState } from "@/lib/actions/publications";
import { HELP_CATEGORIES, HELP_KIND_LABEL } from "@/lib/entraide";

/* Édition d'une publication du membre : mêmes champs que le guichet Publier,
   pré-remplis. Le type ne change pas. Un contenu en ligne ou refusé repasse
   en modération après enregistrement. */

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none aria-[invalid=true]:border-danger";

export type PublicationFormValues = {
  title: string;
  excerpt: string;
  body: string;
  country: string;
  city: string;
  keywords: string;
  cover: string;
  contractType: string;
  startsAt: string;
  timezone: string;
  venue: string;
  isOnline: boolean;
  category: string;
  address: string;
  price: string;
  helpKind: string;
  helpCategory: string;
  urgent: boolean;
};

const CONTRACTS_JOB = ["CDI", "CDD", "Mission", "Freelance"];
const CONTRACTS_INTERNSHIP = ["Stage", "Alternance", "Volontariat"];
const CATEGORIES_EVENT = ["Conférence", "Soirée", "Concert", "Rencontre", "Formation", "Sport", "Religieux", "Autre"];
const CATEGORIES_PLACE = ["Restaurant", "Commerce", "Service", "Coiffure & beauté", "Association", "Lieu de culte", "Autre"];
const CATEGORIES_CLASSIFIED = ["Logement", "Colocation", "Covoiturage", "Services", "Bonnes affaires", "Auto-moto", "Autre"];

/* La valeur en base reste proposée même si elle ne figure plus dans la liste. */
const withCurrent = (list: string[], current: string) => (current && !list.includes(current) ? [current, ...list] : list);

function Feedback({ state }: { state: PublicationState }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error}</p>
      )}
      {state.ok && state.message && (
        <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">{state.message}</p>
      )}
    </>
  );
}

export function PublicationForm({ id, type, status, values }: { id: string; type: ContentType; status: ContentStatus; values: PublicationFormValues }) {
  const [state, action, pending] = useActionState<PublicationState, FormData>(updateContentAction, {});
  const invalid = (champ: string) => (state.champ === champ ? true : undefined);
  const [isOnline, setIsOnline] = useState(values.isOnline);

  const isJob = type === "JOB" || type === "INTERNSHIP";
  const reviewed = status === "PUBLISHED" || status === "REJECTED";

  return (
    <form action={action} noValidate className="space-y-5 border border-line p-5">
      <input type="hidden" name="id" value={id} />
      <Feedback state={state} />

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-bold">Titre *</label>
        <input id="title" name="title" required maxLength={160} defaultValue={values.title} aria-invalid={invalid("title")} className={INPUT} />
      </div>

      <div>
        <label htmlFor="excerpt" className="mb-1 block text-sm font-bold">Chapô <span className="font-normal text-muted">(résumé en une ou deux phrases)</span></label>
        <input id="excerpt" name="excerpt" maxLength={300} defaultValue={values.excerpt} aria-invalid={invalid("excerpt")} className={INPUT} />
      </div>

      <div>
        <label htmlFor="body" className="mb-1 block text-sm font-bold">Texte *</label>
        <textarea id="body" name="body" rows={10} required defaultValue={values.body} aria-invalid={invalid("body")} className={INPUT} />
        <p className="mt-1 text-xs text-muted">Pas de coordonnées personnelles dans le texte : le contact passe par le formulaire relais du site.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LieuFields required country={values.country} city={values.city} countryInvalid={invalid("country")} cityInvalid={invalid("city")} inputClass={INPUT} />
      </div>

      <div>
        <label htmlFor="keywords" className="mb-1 block text-sm font-bold">Mots-clés <span className="font-normal text-muted">(séparés par des virgules)</span></label>
        <input id="keywords" name="keywords" maxLength={500} defaultValue={values.keywords} className={INPUT} />
      </div>
      <div>
        <label htmlFor="cover" className="mb-1 block text-sm font-bold">Photo ou visuel <span className="font-normal text-muted">(facultatif)</span></label>
        {values.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={values.cover} alt="" className="mb-2 h-28 w-auto border border-line object-cover" />
        )}
        <input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" aria-invalid={invalid("cover")} className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-white hover:file:bg-primary-dark" />
        {values.cover && (
          <label className="mt-2 flex items-center gap-2 text-xs text-ink-2"><input type="checkbox" name="removeCover" className="h-4 w-4 accent-primary" /> Retirer le visuel actuel</label>
        )}
        <p className="mt-1 text-xs text-muted">JPG, PNG ou WebP, 3 Mo maximum.</p>
      </div>

      {isJob && (
        <div className="border-t border-line pt-5">
          <label htmlFor="contractType" className="mb-1 block text-sm font-bold">Type de contrat *</label>
          <select id="contractType" name="contractType" defaultValue={values.contractType} aria-invalid={invalid("contractType")} className={`${INPUT} sm:w-1/2`}>
            {withCurrent(type === "JOB" ? CONTRACTS_JOB : CONTRACTS_INTERNSHIP, values.contractType).map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      )}

      {type === "EVENT" && (
        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <label htmlFor="startsAt" className="mb-1 block text-sm font-bold">Date et heure (heure du lieu) *</label>
            <input id="startsAt" name="startsAt" type="datetime-local" defaultValue={values.startsAt} aria-invalid={invalid("startsAt")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="timezone" className="mb-1 block text-sm font-bold">Fuseau horaire du lieu</label>
            <TimezoneSelect value={values.timezone} className={INPUT} />
          </div>
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-bold">Catégorie</label>
            <select id="category" name="category" defaultValue={values.category} className={INPUT}>
              {withCurrent(CATEGORIES_EVENT, values.category).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="venue" className="mb-1 block text-sm font-bold">Lieu</label>
            <input id="venue" name="venue" placeholder="Salle, adresse…" defaultValue={values.venue} disabled={isOnline} aria-invalid={invalid("venue")} className={INPUT} />
          </div>
          <label className="flex items-center gap-2.5 self-end pb-2 text-sm">
            <input type="checkbox" name="isOnline" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} className="h-4 w-4 accent-primary" />
            Événement en ligne
          </label>
        </div>
      )}

      {type === "PLACE" && (
        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-bold">Catégorie *</label>
            <select id="category" name="category" defaultValue={values.category} aria-invalid={invalid("category")} className={INPUT}>
              {withCurrent(CATEGORIES_PLACE, values.category).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="address" className="mb-1 block text-sm font-bold">Adresse</label>
            <input id="address" name="address" autoComplete="street-address" defaultValue={values.address} className={INPUT} />
          </div>
        </div>
      )}

      {type === "CLASSIFIED" && (
        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-bold">Catégorie *</label>
            <select id="category" name="category" defaultValue={values.category} aria-invalid={invalid("category")} className={INPUT}>
              {withCurrent(CATEGORIES_CLASSIFIED, values.category).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-bold">Prix <span className="font-normal text-muted">(facultatif)</span></label>
            <input id="price" name="price" defaultValue={values.price} className={INPUT} />
          </div>
        </div>
      )}

      {type === "HELP_REQUEST" && (
        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
          <div>
            <label htmlFor="helpKind" className="mb-1 block text-sm font-bold">Il s&apos;agit de… *</label>
            <select id="helpKind" name="helpKind" defaultValue={values.helpKind || "NEED"} aria-invalid={invalid("helpKind")} className={INPUT}>
              {(["NEED", "OFFER"] as const).map((k) => <option key={k} value={k}>{HELP_KIND_LABEL[k]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="helpCategory" className="mb-1 block text-sm font-bold">Catégorie *</label>
            <select id="helpCategory" name="helpCategory" defaultValue={values.helpCategory} aria-invalid={invalid("helpCategory")} className={INPUT}>
              {withCurrent([...HELP_CATEGORIES], values.helpCategory).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2.5 self-end pb-2 text-sm">
            <input type="checkbox" name="urgent" defaultChecked={values.urgent} className="h-4 w-4 accent-primary" />
            Demande urgente
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <button
          type="submit"
          disabled={pending}
          className="whitespace-nowrap rounded bg-primary px-6 py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <span className="text-sm text-ink-2">
          {reviewed
            ? "Après enregistrement, le contenu repasse en modération avant d'être remis en ligne."
            : "Le contenu sera relu par la modération avant mise en ligne."}
        </span>
      </div>
    </form>
  );
}

/* Retirer de la ligne : deux clics (le second confirme). */
export function WithdrawButton({ id, compact = false }: { id: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<PublicationState, FormData>(withdrawContentAction, {});
  const [confirm, setConfirm] = useState(false);

  if (!confirm) {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className={compact ? "text-xs font-bold uppercase text-ink-2 hover:text-primary hover:underline" : "whitespace-nowrap rounded border-2 border-line px-4 py-2 text-sm font-bold text-ink hover:border-primary hover:text-primary"}
        >
          Retirer{compact ? "" : " de la ligne"}
        </button>
        {state.ok && state.message && <span role="status" className="text-xs text-primary-dark">{state.message}</span>}
      </span>
    );
  }

  return (
    <form action={action} className={`inline-flex flex-wrap items-center gap-2 ${compact ? "" : "rounded border border-line bg-paper-2 p-3"}`}>
      <input type="hidden" name="id" value={id} />
      {!compact && <span className="text-sm text-ink-2">Le contenu ne sera plus visible sur le site. Vous pourrez le republier.</span>}
      <button type="submit" disabled={pending} className="whitespace-nowrap rounded bg-primary px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-primary-dark disabled:opacity-60">
        {pending ? "Retrait…" : "Confirmer le retrait"}
      </button>
      <button type="button" onClick={() => setConfirm(false)} className="text-xs font-bold uppercase text-ink-2 hover:underline">
        Annuler
      </button>
      {state.error && <span role="alert" className="text-xs text-danger">{state.error}</span>}
    </form>
  );
}

/* Republier un contenu retiré : repasse en modération. */
export function RepublishButton({ id, compact = false }: { id: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<PublicationState, FormData>(republishContentAction, {});
  return (
    <form action={action} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className={compact ? "text-xs font-bold uppercase text-primary hover:underline disabled:opacity-60" : "whitespace-nowrap rounded border-2 border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white disabled:opacity-60"}
      >
        {pending ? "Envoi…" : "Republier"}
      </button>
      {state.error && <span role="alert" className="text-xs text-danger">{state.error}</span>}
      {state.ok && state.message && !compact && <span role="status" className="text-xs text-primary-dark">{state.message}</span>}
    </form>
  );
}

/* Entraide : la demande est résolue → marquée et retirée de la rubrique. */
export function ResolveHelpButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState<PublicationState, FormData>(resolveHelpAction, {});
  if (state.ok) return <p role="status" className="text-sm text-primary-dark">{state.message}</p>;
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
        {pending ? "Enregistrement…" : "C'est résolu, merci !"}
      </button>
      <span className="text-sm text-ink-2">La demande quitte la rubrique Entraide ; vous pourrez la republier si besoin.</span>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { TimezoneSelect } from "@/components/site/timezone-select";
import type { ContentStatus, ContentType } from "@prisma/client";
import { createContentAction, updateContentAdminAction, type AdminFormState } from "@/lib/actions/admin";
import { ADMIN_STATUSES, CONTENT_STATUS_LABEL, type AdminContentType } from "@/components/admin/ui";

/* Formulaire générique de contenu du back-office (création et modification).
   Champs communs + champs de détails selon le type ; l'équipe choisit le statut.
   Les règles de validation sont celles du guichet Publier, complétées côté admin
   (src/lib/actions/admin.ts). */

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none aria-[invalid=true]:border-danger";
const LABEL = "mb-1 block text-sm font-bold";
const HINT = "mt-1 text-xs text-muted";

export type ContentFormValues = {
  title: string;
  excerpt: string;
  body: string;
  country: string;
  city: string;
  keywords: string;
  cover: string;
  lat: string;
  lng: string;
  featured: boolean;
  expiresAt: string;
  contractType: string;
  salary: string;
  applyMode: string;
  applyTarget: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  venue: string;
  isOnline: boolean;
  category: string;
  ticketUrl: string;
  address: string;
  phone: string;
  hours: string;
  verified: boolean;
  price: string;
  promoCode: string;
  conditions: string;
  validFrom: string;
  validTo: string;
};

export const EMPTY_VALUES: ContentFormValues = {
  title: "", excerpt: "", body: "", country: "", city: "", keywords: "", cover: "", lat: "", lng: "", featured: false, expiresAt: "",
  contractType: "", salary: "", applyMode: "relay_email", applyTarget: "",
  startsAt: "", endsAt: "", timezone: "", venue: "", isOnline: false, category: "", ticketUrl: "",
  address: "", phone: "", hours: "", verified: false,
  price: "", promoCode: "", conditions: "", validFrom: "", validTo: "",
};

/* Mêmes listes que le guichet Publier (src/app/compte/publications/[id]/form.tsx). */
const CONTRACTS_JOB = ["CDI", "CDD", "Mission", "Freelance"];
const CONTRACTS_INTERNSHIP = ["Stage", "Alternance", "Volontariat"];
const CATEGORIES_EVENT = ["Conférence", "Soirée", "Concert", "Rencontre", "Formation", "Sport", "Religieux", "Autre"];
const CATEGORIES_PLACE = ["Restaurant", "Commerce", "Service", "Coiffure & beauté", "Association", "Lieu de culte", "Autre"];
const CATEGORIES_CLASSIFIED = ["Logement", "Colocation", "Covoiturage", "Services", "Bonnes affaires", "Auto-moto", "Autre"];
const CATEGORIES_MEMORY = ["Site historique", "Musée", "Monument", "Palais royal", "Lieu de culte", "Mémoire de la traite", "Autre"];

/* La valeur en base reste proposée même si elle ne figure plus dans la liste. */
const withCurrent = (list: string[], current: string) => (current && !list.includes(current) ? [current, ...list] : list);

const isJobType = (t: ContentType) => t === "JOB" || t === "INTERNSHIP";
const isArticleType = (t: ContentType) => t === "ARTICLE" || t === "MEMBER_ARTICLE";

function Feedback({ state }: { state: AdminFormState }) {
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

export type TypeOption = { value: AdminContentType; label: string };

type Props =
  | { mode: "create"; type: AdminContentType; typeOptions?: TypeOption[]; values?: ContentFormValues; status?: undefined; id?: undefined }
  | { mode: "edit"; id: string; type: ContentType; status: ContentStatus; values: ContentFormValues; typeOptions?: undefined };

export function ContentForm(props: Props) {
  const values = props.values ?? EMPTY_VALUES;
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    props.mode === "create" ? createContentAction : updateContentAdminAction,
    {},
  );
  const invalid = (champ: string) => (state.champ === champ ? true : undefined);
  const [type, setType] = useState<ContentType>(props.type);
  const [isOnline, setIsOnline] = useState(values.isOnline);
  const [applyMode, setApplyMode] = useState(values.applyMode || "relay_email");

  const isJob = isJobType(type);
  const isArticle = isArticleType(type);
  const isPlace = type === "PLACE" || type === "MEMORY_PLACE";
  const hasExpiry = !isArticle && type !== "MEMORY_PLACE";

  return (
    <form action={action} noValidate className="space-y-5">
      {props.mode === "edit" && <input type="hidden" name="id" value={props.id} />}
      <Feedback state={state} />

      {props.mode === "create" && props.typeOptions && props.typeOptions.length > 1 ? (
        <div>
          <label htmlFor="type" className={LABEL}>Type de contenu *</label>
          <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as ContentType)} className={`${INPUT} sm:w-1/2`}>
            {props.typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      ) : (
        props.mode === "create" && <input type="hidden" name="type" value={type} />
      )}

      <div>
        <label htmlFor="title" className={LABEL}>Titre *</label>
        <input id="title" name="title" required minLength={5} maxLength={160} defaultValue={values.title} aria-invalid={invalid("title")} className={INPUT} />
        {props.mode === "create" ? (
          <p className={HINT}>L&apos;adresse de la fiche (slug) est dérivée du titre.</p>
        ) : (
          <p className={HINT}>L&apos;adresse de la fiche (slug) ne change pas pour ne pas casser les liens existants.</p>
        )}
      </div>

      <div>
        <label htmlFor="excerpt" className={LABEL}>Chapô <span className="font-normal text-muted">(résumé en une ou deux phrases)</span></label>
        <textarea id="excerpt" name="excerpt" rows={2} maxLength={400} defaultValue={values.excerpt} aria-invalid={invalid("excerpt")} className={INPUT} />
      </div>

      <div>
        <label htmlFor="body" className={LABEL}>Texte *</label>
        <textarea id="body" name="body" rows={isArticle ? 14 : 8} required minLength={30} defaultValue={values.body} aria-invalid={invalid("body")} className={INPUT} />
        <p className={HINT}>Texte brut ou Markdown simple (paragraphes séparés par une ligne vide). Aucune coordonnée personnelle : le contact passe par le formulaire relais.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="country" className={LABEL}>Pays {isArticle ? "" : "*"}</label>
          <input id="country" name="country" maxLength={80} autoComplete="country-name" defaultValue={values.country} aria-invalid={invalid("country")} className={INPUT} />
        </div>
        <div>
          <label htmlFor="city" className={LABEL}>Ville {isArticle ? "" : "*"}</label>
          <input id="city" name="city" maxLength={80} autoComplete="address-level2" defaultValue={values.city} aria-invalid={invalid("city")} className={INPUT} />
        </div>
        <div>
          <label htmlFor="lat" className={LABEL}>Latitude <span className="font-normal text-muted">(facultatif)</span></label>
          <input id="lat" name="lat" type="number" step="any" min={-90} max={90} defaultValue={values.lat} aria-invalid={invalid("lat")} className={INPUT} />
        </div>
        <div>
          <label htmlFor="lng" className={LABEL}>Longitude <span className="font-normal text-muted">(facultatif)</span></label>
          <input id="lng" name="lng" type="number" step="any" min={-180} max={180} defaultValue={values.lng} aria-invalid={invalid("lng")} className={INPUT} />
          <p className={HINT}>Vides : les coordonnées sont cherchées à partir de la ville et du pays (OpenStreetMap).</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="keywords" className={LABEL}>Mots-clés <span className="font-normal text-muted">(séparés par des virgules, 15 max.)</span></label>
          <input id="keywords" name="keywords" maxLength={500} defaultValue={values.keywords} className={INPUT} />
          <p className={HINT}>Les nouveaux mots-clés sont créés dans la famille « Thème ».</p>
        </div>
        <div>
          <label htmlFor="cover" className={LABEL}>Image de couverture <span className="font-normal text-muted">(adresse web, facultatif)</span></label>
          <input id="cover" name="cover" type="url" maxLength={500} placeholder="https://…" defaultValue={values.cover} aria-invalid={invalid("cover")} className={INPUT} />
        </div>
      </div>

      {isJob && (
        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contractType" className={LABEL}>Type de contrat *</label>
            <select id="contractType" name="contractType" defaultValue={values.contractType} aria-invalid={invalid("contractType")} className={INPUT}>
              {withCurrent(type === "JOB" ? CONTRACTS_JOB : CONTRACTS_INTERNSHIP, values.contractType).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="salary" className={LABEL}>Rémunération <span className="font-normal text-muted">(facultatif)</span></label>
            <input id="salary" name="salary" maxLength={80} defaultValue={values.salary} className={INPUT} />
          </div>
          <div>
            <label htmlFor="applyMode" className={LABEL}>Mode de candidature *</label>
            <select id="applyMode" name="applyMode" value={applyMode} onChange={(e) => setApplyMode(e.target.value)} className={INPUT}>
              <option value="relay_email">E-mail relais (jamais affiché)</option>
              <option value="form">Formulaire du site</option>
              <option value="link">Lien externe</option>
            </select>
          </div>
          <div>
            <label htmlFor="applyTarget" className={LABEL}>
              {applyMode === "link" ? "Adresse web de candidature *" : applyMode === "relay_email" ? "E-mail relais du recruteur" : "Cible"}
            </label>
            <input
              id="applyTarget"
              name="applyTarget"
              type={applyMode === "link" ? "url" : applyMode === "relay_email" ? "email" : "text"}
              maxLength={300}
              disabled={applyMode === "form"}
              defaultValue={values.applyTarget}
              aria-invalid={invalid("applyTarget")}
              className={INPUT}
            />
            <p className={HINT}>L&apos;e-mail n&apos;est jamais exposé sur le site.</p>
          </div>
        </div>
      )}

      {type === "EVENT" && (
        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <label htmlFor="startsAt" className={LABEL}>Début *</label>
            <input id="startsAt" name="startsAt" type="datetime-local" defaultValue={values.startsAt} aria-invalid={invalid("startsAt")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="endsAt" className={LABEL}>Fin <span className="font-normal text-muted">(facultatif)</span></label>
            <input id="endsAt" name="endsAt" type="datetime-local" defaultValue={values.endsAt} aria-invalid={invalid("endsAt")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="timezone" className={LABEL}>Fuseau horaire du lieu</label>
            <TimezoneSelect value={values.timezone} className={INPUT} />
            <p className="mt-1 text-xs text-muted">Les heures ci-dessus sont celles du lieu ; le site affiche aussi l&apos;heure de Cotonou.</p>
          </div>
          <div>
            <label htmlFor="category" className={LABEL}>Catégorie</label>
            <select id="category" name="category" defaultValue={values.category} className={INPUT}>
              {withCurrent(CATEGORIES_EVENT, values.category).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ticketUrl" className={LABEL}>Billetterie <span className="font-normal text-muted">(adresse web, facultatif)</span></label>
            <input id="ticketUrl" name="ticketUrl" type="url" maxLength={500} defaultValue={values.ticketUrl} aria-invalid={invalid("ticketUrl")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="venue" className={LABEL}>Lieu</label>
            <input id="venue" name="venue" maxLength={200} placeholder="Salle, adresse…" defaultValue={values.venue} disabled={isOnline} aria-invalid={invalid("venue")} className={INPUT} />
          </div>
          <label className="flex items-center gap-2.5 self-end pb-2 text-sm">
            <input type="checkbox" name="isOnline" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} className="h-4 w-4 accent-primary" />
            Événement en ligne
          </label>
        </div>
      )}

      {isPlace && (
        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className={LABEL}>Catégorie *</label>
            <select id="category" name="category" defaultValue={values.category} aria-invalid={invalid("category")} className={INPUT}>
              {withCurrent(type === "MEMORY_PLACE" ? CATEGORIES_MEMORY : CATEGORIES_PLACE, values.category).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="address" className={LABEL}>Adresse</label>
            <input id="address" name="address" maxLength={200} autoComplete="street-address" defaultValue={values.address} className={INPUT} />
          </div>
          <div>
            <label htmlFor="phone" className={LABEL}>Téléphone <span className="font-normal text-muted">(facultatif)</span></label>
            <input id="phone" name="phone" maxLength={40} defaultValue={values.phone} className={INPUT} />
          </div>
          <div>
            <label htmlFor="hours" className={LABEL}>Horaires <span className="font-normal text-muted">(facultatif)</span></label>
            <input id="hours" name="hours" maxLength={200} defaultValue={values.hours} className={INPUT} />
          </div>
          <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
            <input type="checkbox" name="verified" defaultChecked={values.verified} className="h-4 w-4 accent-primary" />
            Informations vérifiées par l&apos;équipe
          </label>
        </div>
      )}

      {type === "CLASSIFIED" && (
        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className={LABEL}>Catégorie *</label>
            <select id="category" name="category" defaultValue={values.category} aria-invalid={invalid("category")} className={INPUT}>
              {withCurrent(CATEGORIES_CLASSIFIED, values.category).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="price" className={LABEL}>Prix <span className="font-normal text-muted">(facultatif)</span></label>
            <input id="price" name="price" maxLength={60} defaultValue={values.price} className={INPUT} />
          </div>
        </div>
      )}

      {type === "DEAL" && (
        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <label htmlFor="promoCode" className={LABEL}>Code promo <span className="font-normal text-muted">(facultatif)</span></label>
            <input id="promoCode" name="promoCode" maxLength={60} defaultValue={values.promoCode} className={INPUT} />
          </div>
          <div>
            <label htmlFor="conditions" className={LABEL}>Conditions <span className="font-normal text-muted">(facultatif)</span></label>
            <input id="conditions" name="conditions" maxLength={1000} defaultValue={values.conditions} className={INPUT} />
          </div>
          <div>
            <label htmlFor="validFrom" className={LABEL}>Valable du</label>
            <input id="validFrom" name="validFrom" type="date" defaultValue={values.validFrom} aria-invalid={invalid("validFrom")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="validTo" className={LABEL}>Valable jusqu&apos;au</label>
            <input id="validTo" name="validTo" type="date" defaultValue={values.validTo} aria-invalid={invalid("validTo")} className={INPUT} />
          </div>
        </div>
      )}

      <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className={LABEL}>Statut</label>
          {props.mode === "create" ? (
            <select id="status" name="status" defaultValue="DRAFT" className={INPUT}>
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publier maintenant</option>
            </select>
          ) : (
            <select id="status" name="status" defaultValue={ADMIN_STATUSES.includes(props.status as (typeof ADMIN_STATUSES)[number]) ? props.status : "DRAFT"} className={INPUT}>
              {ADMIN_STATUSES.map((s) => <option key={s} value={s}>{CONTENT_STATUS_LABEL[s]}</option>)}
            </select>
          )}
          {props.mode === "edit" && (props.status === "SCHEDULED" || props.status === "EXPIRED") && (
            <p className={HINT}>Statut actuel : {CONTENT_STATUS_LABEL[props.status]} (choisissez le nouveau statut ci-dessus).</p>
          )}
        </div>
        {hasExpiry && (
          <div>
            <label htmlFor="expiresAt" className={LABEL}>Date d&apos;expiration {isJob ? "" : <span className="font-normal text-muted">(facultatif)</span>}</label>
            <input id="expiresAt" name="expiresAt" type="date" defaultValue={values.expiresAt} aria-invalid={invalid("expiresAt")} className={INPUT} />
          </div>
        )}
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" name="featured" defaultChecked={values.featured} className="h-4 w-4 accent-primary" />
          Mettre en avant (à la une)
        </label>
        {props.mode === "create" && (
          <label className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" name="asAuthor" defaultChecked={isArticle} className="mt-0.5 h-4 w-4 accent-primary" />
            <span>
              Signer de mon profil
              <span className="block text-xs text-muted">Affiche l&apos;auteur et reçoit les réponses du formulaire relais. Sinon, « publié par la rédaction ».</span>
            </span>
          </label>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <button
          type="submit"
          disabled={pending}
          className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : props.mode === "create" ? "Enregistrer" : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}

/* Panneau repliable « Nouveau … » posé dans l'en-tête des pages de liste. */
export function NewContentPanel({ label, heading, type, typeOptions }: { label: string; heading: string; type: AdminContentType; typeOptions?: TypeOption[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="w-full space-y-4 rounded border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">{heading}</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold uppercase text-ink-2 hover:text-primary">
          Fermer
        </button>
      </div>
      <ContentForm mode="create" type={type} typeOptions={typeOptions} />
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { Avatar } from "@/components/site/avatar";
import { updateProfileAction, type ProfileState } from "@/lib/actions/profile";

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export type ProfilFormValues = {
  displayName: string;
  headline: string;
  photo: string;
  city: string;
  country: string;
  bio: string;
  website: string;
  keywords: string;
  directory: boolean;
  kind: "MEMBER" | "COMPANY" | "ASSOCIATION" | "ARTIST";
  companySize: string;
  companySector: string;
  assocPurpose: string;
  assocFoundedYear: string;
  assocMembersCount: string;
  artistDiscipline: string;
};

const TAILLES = ["1 à 9 salariés", "10 à 49 salariés", "50 à 249 salariés", "250 salariés et plus"];

const KINDS = [
  { value: "MEMBER", label: "Moi-même (particulier)" },
  { value: "COMPANY", label: "Une entreprise" },
  { value: "ASSOCIATION", label: "Une association" },
  { value: "ARTIST", label: "Un artiste ou un groupe" },
] as const;

export function ProfilForm({ values }: { values: ProfilFormValues }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfileAction, {});
  const [kind, setKind] = useState(values.kind);

  return (
    <form action={action} className="space-y-6">
      {state.error && (
        <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error}</p>
      )}
      {state.ok && (
        <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">Profil enregistré.</p>
      )}

      <div className="space-y-2 border border-line p-5">
        <label htmlFor="kind" className="block text-sm font-bold">Je représente</label>
        <select id="kind" name="kind" defaultValue={values.kind} onChange={(e) => setKind(e.target.value as ProfilFormValues["kind"])} className={INPUT}>
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <p className="text-xs text-muted">Ce choix décide de l&apos;annuaire où votre fiche apparaît : membres, entreprises, associations ou artistes. Modifiable à tout moment.</p>
        {kind === "COMPANY" && (
          <div className="grid gap-4 pt-3 sm:grid-cols-2">
            <div>
              <label htmlFor="companySector" className="mb-1 block text-sm font-bold">Secteur</label>
              <input id="companySector" name="companySector" maxLength={80} defaultValue={values.companySector} placeholder="BTP, agroalimentaire, services…" className={INPUT} />
            </div>
            <div>
              <label htmlFor="companySize" className="mb-1 block text-sm font-bold">Taille</label>
              <select id="companySize" name="companySize" defaultValue={values.companySize} className={INPUT}>
                <option value="">Non précisée</option>
                {TAILLES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )}
        {kind === "ASSOCIATION" && (
          <div className="grid gap-4 pt-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="assocPurpose" className="mb-1 block text-sm font-bold">Objet de l&apos;association</label>
              <textarea id="assocPurpose" name="assocPurpose" rows={2} maxLength={400} defaultValue={values.assocPurpose} placeholder="Ce que fait l'association, pour qui." className={INPUT} />
            </div>
            <div>
              <label htmlFor="assocFoundedYear" className="mb-1 block text-sm font-bold">Année de création</label>
              <input id="assocFoundedYear" name="assocFoundedYear" type="number" min={1800} max={2100} defaultValue={values.assocFoundedYear} className={INPUT} />
            </div>
            <div>
              <label htmlFor="assocMembersCount" className="mb-1 block text-sm font-bold">Nombre de membres</label>
              <input id="assocMembersCount" name="assocMembersCount" type="number" min={0} defaultValue={values.assocMembersCount} className={INPUT} />
            </div>
          </div>
        )}
        {kind === "ARTIST" && (
          <div className="pt-3">
            <label htmlFor="artistDiscipline" className="mb-1 block text-sm font-bold">Discipline</label>
            <input id="artistDiscipline" name="artistDiscipline" maxLength={80} defaultValue={values.artistDiscipline} placeholder="Musique, danse, arts visuels, cinéma, littérature…" className={INPUT} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 border border-line p-5">
        <Avatar name={values.displayName} photo={values.photo || null} size="lg" />
        <div className="min-w-0 flex-1">
          <label htmlFor="photo" className="mb-1 block text-sm font-bold">Photo de profil</label>
          <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-white hover:file:bg-primary-dark" />
          <p className="mt-1 text-xs text-muted">JPG, PNG ou WebP, 2 Mo maximum. Visible sur votre fiche et dans l&apos;annuaire.</p>
          {values.photo && (
            <label className="mt-2 flex items-center gap-2 text-xs text-ink-2">
              <input type="checkbox" name="removePhoto" className="h-4 w-4 accent-primary" /> Retirer ma photo
            </label>
          )}
        </div>
      </div>

      <div className="border border-line">
        <div className="flex items-center justify-between border-b border-line bg-paper-2 px-4 py-3">
          <p className="font-bold">Visibilité dans l&apos;annuaire</p>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="directory" defaultChecked={values.directory} className="h-4 w-4 accent-primary" />
            J&apos;apparais dans l&apos;annuaire des membres
          </label>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="displayName" className="mb-1 block text-sm font-bold">Nom affiché *</label>
            <input id="displayName" name="displayName" required defaultValue={values.displayName} className={INPUT} />
            <p className="mt-1 text-xs text-muted">Par exemple « Prénom N. » — le nom complet n&apos;est jamais obligatoire.</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="headline" className="mb-1 block text-sm font-bold">Fonction ou activité (affichée sous votre nom)</label>
            <input id="headline" name="headline" maxLength={120} defaultValue={values.headline} placeholder="Ingénieure logiciel · Sage-femme · Importatrice de cajou…" className={INPUT} />
          </div>
          <div>
            <label htmlFor="city" className="mb-1 block text-sm font-bold">Ville</label>
            <input id="city" name="city" defaultValue={values.city} autoComplete="address-level2" className={INPUT} />
          </div>
          <div>
            <label htmlFor="country" className="mb-1 block text-sm font-bold">Pays</label>
            <input id="country" name="country" defaultValue={values.country} autoComplete="country-name" className={INPUT} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="website" className="mb-1 block text-sm font-bold">Site web ou LinkedIn</label>
            <input id="website" name="website" type="url" placeholder="https://" defaultValue={values.website} className={INPUT} />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-bold">Bio (visible sur le profil)</label>
        <textarea id="bio" name="bio" rows={5} maxLength={1500} defaultValue={values.bio} className={INPUT} />
      </div>

      <div>
        <label htmlFor="keywords" className="mb-1 block text-sm font-bold">Mes mots-clés (secteurs, lieux, thèmes)</label>
        <input id="keywords" name="keywords" defaultValue={values.keywords} placeholder="BTP, Cotonou, Retour au pays" className={INPUT} />
        <p className="mt-1 text-xs text-muted">Séparés par des virgules, 15 maximum. Ils déterminent où votre profil apparaît et les alertes qui vous concernent.</p>
      </div>

      <p className="text-xs text-muted">
        Votre e-mail n&apos;est jamais affiché : les contacts passent par un formulaire relais. La visibilité champ par
        champ (membres connectés / privé) arrive avec l&apos;espace communauté.
      </p>

      <div className="flex gap-3 border-t border-line pt-4">
        <button type="submit" disabled={pending} className="rounded bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

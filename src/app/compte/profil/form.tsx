"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileState } from "@/lib/actions/profile";

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export type ProfilFormValues = {
  displayName: string;
  city: string;
  country: string;
  bio: string;
  website: string;
  keywords: string;
  directory: boolean;
};

export function ProfilForm({ values }: { values: ProfilFormValues }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfileAction, {});

  return (
    <form action={action} className="space-y-6">
      {state.error && (
        <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error}</p>
      )}
      {state.ok && (
        <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">Profil enregistré.</p>
      )}

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

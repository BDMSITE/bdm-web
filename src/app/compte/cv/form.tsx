"use client";

import { useActionState } from "react";
import { updateCvAction, type ActionState } from "@/lib/actions/compte";

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function CvForm({ cvUrl, cvPublished }: { cvUrl: string; cvPublished: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateCvAction, {});

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error}</p>
      )}
      {state.ok && (
        <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">CV enregistré.</p>
      )}

      <div className="space-y-3 border border-line p-5">
        <label htmlFor="cvUrl" className="block text-sm font-bold">Lien vers mon CV (PDF)</label>
        <input id="cvUrl" name="cvUrl" type="url" placeholder="https://" defaultValue={cvUrl} className={INPUT} />
        <p className="text-xs text-muted">
          Collez l&apos;adresse d&apos;un PDF hébergé en ligne (Google Drive, Dropbox, LinkedIn…). Le dépôt direct d&apos;un fichier
          arrivera plus tard. Laissez vide pour retirer votre CV.
        </p>
      </div>

      <div className="space-y-3 border border-line p-5">
        <p className="font-bold">Visibilité auprès des recruteurs</p>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="cvPublished" defaultChecked={cvPublished} className="mt-0.5 h-4 w-4 accent-primary" />
          <span>
            <strong>CV visible des recruteurs.</strong> Les recruteurs partenaires peuvent consulter votre CV depuis votre
            profil. Décoché, votre CV ne sert qu&apos;à vos propres candidatures.
          </span>
        </label>
      </div>

      <div className="flex gap-3 border-t border-line pt-4">
        <button type="submit" disabled={pending} className="rounded bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

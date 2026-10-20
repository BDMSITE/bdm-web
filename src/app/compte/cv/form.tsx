"use client";

import { useActionState } from "react";
import { updateCvAction, removeCvAction, type ActionState } from "@/lib/actions/compte";

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function CvForm({ cvUrl, cvPublished, hosted, uploadEnabled }: { cvUrl: string; cvPublished: boolean; hosted: boolean; uploadEnabled: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateCvAction, {});

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error}</p>
      )}
      {state.ok && (
        <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">CV enregistré.</p>
      )}

      {uploadEnabled && (
        <div className="space-y-3 border border-line p-5">
          <label htmlFor="cvFile" className="block text-sm font-bold">Déposer mon CV (PDF, 3 Mo max.)</label>
          <input id="cvFile" name="cvFile" type="file" accept="application/pdf,.pdf" className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-primary-dark" />
          <p className="text-xs text-muted">
            {hosted ? "Un CV est déjà déposé : choisir un nouveau fichier le remplace." : "Le fichier est stocké de façon privée : il n'est jamais accessible par un lien public."}
          </p>
        </div>
      )}

      <div className="space-y-3 border border-line p-5">
        <label htmlFor="cvUrl" className="block text-sm font-bold">{uploadEnabled ? "Ou lien vers mon CV en ligne" : "Lien vers mon CV (PDF)"}</label>
        <input id="cvUrl" name="cvUrl" type="url" placeholder="https://" defaultValue={hosted ? "" : cvUrl} className={INPUT} />
        <p className="text-xs text-muted">
          Adresse d&apos;un PDF hébergé en ligne (Google Drive, Dropbox, LinkedIn…).
          {hosted ? " Renseigner un lien remplace le fichier déposé." : " Laissez vide pour retirer votre CV."}
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

      <div className="flex flex-wrap gap-3 border-t border-line pt-4">
        <button type="submit" disabled={pending} className="rounded bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {cvUrl && (
          <button type="submit" formAction={removeCvAction} disabled={pending} className="rounded border-2 border-line px-5 py-2.5 text-sm font-bold text-ink-2 hover:border-danger hover:text-danger disabled:opacity-60">
            Retirer mon CV
          </button>
        )}
      </div>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { createCelebrityAction, type AdminFormState } from "@/lib/actions/admin";
import { NewContentPanel } from "../contenus/content-form";

/* Mémoire : panneau « Nouveau lieu de mémoire » (formulaire générique, type
   MEMORY_PLACE) et formulaire « Nouvelle personnalité » (table Celebrity). */

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none aria-[invalid=true]:border-danger";
const LABEL = "mb-1 block text-sm font-bold";

export function MemoryPlacePanel() {
  return <NewContentPanel label="Nouveau lieu de mémoire" heading="Nouveau lieu de mémoire" type="MEMORY_PLACE" />;
}

export function CelebrityForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminFormState, FormData>(createCelebrityAction, {});
  const invalid = (champ: string) => (state.champ === champ ? true : undefined);

  if (!open) {
    return (
      <>
        {state.ok && (
          <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2 text-sm text-primary-dark">{state.message}</p>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="whitespace-nowrap rounded border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white"
        >
          Nouvelle personnalité
        </button>
      </>
    );
  }

  return (
    <form action={action} noValidate className="w-full space-y-4 rounded border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">Nouvelle personnalité (Béninois qui comptent)</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold uppercase text-ink-2 hover:text-primary">
          Fermer
        </button>
      </div>

      {state.error && (
        <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error}</p>
      )}
      {state.ok && (
        <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">{state.message}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={LABEL}>Nom *</label>
          <input id="name" name="name" required minLength={2} maxLength={120} aria-invalid={invalid("name")} className={INPUT} />
        </div>
        <div>
          <label htmlFor="domain" className={LABEL}>Domaine</label>
          <input id="domain" name="domain" maxLength={60} placeholder="Musique, Sport, Sciences…" aria-invalid={invalid("domain")} className={INPUT} />
          <p className="mt-1 text-xs text-muted">Sert de filtre sur la page publique : gardez une orthographe constante.</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="bio" className={LABEL}>Biographie</label>
          <textarea id="bio" name="bio" rows={6} maxLength={5000} aria-invalid={invalid("bio")} className={INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="photo" className={LABEL}>Photo <span className="font-normal text-muted">(adresse web, facultatif)</span></label>
          <input id="photo" name="photo" type="url" maxLength={500} placeholder="https://…" aria-invalid={invalid("photo")} className={INPUT} />
          <p className="mt-1 text-xs text-muted">Vérifiez le droit d&apos;utilisation de l&apos;image (licence, crédit).</p>
        </div>
        {[1, 2, 3].map((n) => (
          <div key={n} className="grid gap-4 sm:col-span-2 sm:grid-cols-[1fr_2fr]">
            <div>
              <label htmlFor={`link${n}Label`} className={LABEL}>Lien {n} — libellé</label>
              <input id={`link${n}Label`} name={`link${n}Label`} maxLength={60} placeholder="Site officiel, Wikipédia…" className={INPUT} />
            </div>
            <div>
              <label htmlFor={`link${n}Url`} className={LABEL}>Lien {n} — adresse web</label>
              <input id={`link${n}Url`} name={`link${n}Url`} type="url" maxLength={500} placeholder="https://…" aria-invalid={invalid(`link${n}Url`)} className={INPUT} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={pending}
          className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : "Créer la fiche"}
        </button>
      </div>
    </form>
  );
}

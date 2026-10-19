"use client";

import { useActionState, useState } from "react";
import { createArticleAction, type AdminActionState } from "@/lib/actions/admin";

/* Formulaire « Nouvel article » de la rédaction (repliable). */

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function ArticleForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminActionState, FormData>(createArticleAction, {});

  if (!open) {
    return (
      <>
        {state.ok && (
          <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2 text-sm text-primary-dark">{state.message}</p>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark"
        >
          Écrire un article
        </button>
      </>
    );
  }

  return (
    <form action={action} className="w-full space-y-4 rounded border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">Nouvel article</h2>
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
        <div className="sm:col-span-2">
          <label htmlFor="title" className="mb-1 block text-sm font-bold">Titre *</label>
          <input id="title" name="title" required minLength={5} maxLength={160} className={INPUT} />
          <p className="mt-1 text-xs text-muted">L&apos;adresse de l&apos;article (slug) est dérivée du titre.</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="excerpt" className="mb-1 block text-sm font-bold">Chapô</label>
          <textarea id="excerpt" name="excerpt" rows={2} maxLength={400} className={INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="body" className="mb-1 block text-sm font-bold">Corps de l&apos;article *</label>
          <textarea id="body" name="body" rows={12} required minLength={20} className={`${INPUT} font-mono`} />
          <p className="mt-1 text-xs text-muted">Texte brut ou Markdown simple (paragraphes séparés par une ligne vide, **gras**, listes avec « - »).</p>
        </div>
        <div>
          <label htmlFor="country" className="mb-1 block text-sm font-bold">Pays</label>
          <input id="country" name="country" maxLength={80} className={INPUT} />
        </div>
        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-bold">Ville</label>
          <input id="city" name="city" maxLength={80} className={INPUT} />
        </div>
        <div>
          <label htmlFor="keywords" className="mb-1 block text-sm font-bold">Mots-clés</label>
          <input id="keywords" name="keywords" maxLength={500} placeholder="Portrait, Retour au pays, Cotonou" className={INPUT} />
          <p className="mt-1 text-xs text-muted">Séparés par des virgules (15 max.). Les nouveaux sont créés dans la famille « Thème ».</p>
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-bold">Statut</label>
          <select id="status" name="status" defaultValue="DRAFT" className={INPUT}>
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publier maintenant</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={pending}
          className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : "Enregistrer l'article"}
        </button>
      </div>
    </form>
  );
}

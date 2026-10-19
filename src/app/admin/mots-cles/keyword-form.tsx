"use client";

import { useActionState } from "react";
import { createKeywordAction, type AdminActionState } from "@/lib/actions/admin";

/* Ajout d'un mot-clé (nom + famille). */

export function KeywordForm() {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(createKeywordAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      {state.error && <span role="alert" className="text-sm text-danger">{state.error}</span>}
      {state.ok && <span role="status" className="text-sm text-primary-dark">{state.message}</span>}
      <input
        name="name"
        required
        minLength={2}
        maxLength={60}
        placeholder="Nouveau mot-clé"
        aria-label="Nom du mot-clé"
        className="rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <select name="family" defaultValue="THEME" aria-label="Famille" className="rounded border border-line bg-paper px-2 py-2 text-sm">
        <option value="THEME">Thème</option>
        <option value="SECTOR">Secteur</option>
        <option value="PLACE">Lieu</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
      >
        {pending ? "Ajout…" : "Ajouter"}
      </button>
    </form>
  );
}

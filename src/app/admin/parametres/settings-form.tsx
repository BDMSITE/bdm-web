"use client";

import { useActionState } from "react";
import { saveSettingsAction, type AdminActionState } from "@/lib/actions/admin";

/* Réglages modifiables sans redéploiement : liens des réseaux sociaux affichés
   dans l'en-tête et le pied de page. Vide = l'icône renvoie vers la page contact. */

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

type Field = { key: string; label: string; type?: "url" | "number"; hint?: string; placeholder?: string };

export function SettingsForm({ fields, values, canEdit, note }: { fields: Field[]; values: Record<string, string>; canEdit: boolean; note?: string }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(saveSettingsAction, {});
  return (
    <form action={action} className="space-y-3 p-4">
      {state.error && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2 text-sm text-primary-dark">{state.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label htmlFor={f.key} className="mb-1 block text-xs font-bold">{f.label}</label>
            <input id={f.key} name={f.key} type={f.type ?? "url"} inputMode={f.type === "number" ? "numeric" : undefined} defaultValue={values[f.key] ?? ""} placeholder={f.placeholder ?? (f.type === "number" ? "" : "https://…")} disabled={!canEdit} className={INPUT} />
            {f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
          </div>
        ))}
      </div>
      {canEdit && (
        <button type="submit" disabled={pending} className="rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      )}
      <p className="text-xs text-muted">{note ?? "Tant qu'un lien est vide, son icône reste visible et renvoie vers la page Contact."}</p>
    </form>
  );
}

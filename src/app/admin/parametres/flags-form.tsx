"use client";

import { useActionState } from "react";
import { saveFlagsAction, type AdminActionState } from "@/lib/actions/admin";

/* Interrupteurs oui / non du site (sécurité, validation des fiches…), enregistrés en base. */

export function FlagsForm({ flags, canEdit }: { flags: { key: string; label: string; hint: string; on: boolean }[]; canEdit: boolean }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(saveFlagsAction, {});
  return (
    <form action={action} className="space-y-3 p-4">
      {state.error && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2 text-sm text-primary-dark">{state.message}</p>}
      {flags.map((f) => (
        <label key={f.key} className="flex items-start gap-3 text-sm">
          <input type="checkbox" name={f.key} defaultChecked={f.on} disabled={!canEdit} className="mt-0.5 h-5 w-5 accent-primary" />
          <span>
            <span className="block font-bold">{f.label}</span>
            <span className="block text-xs text-muted">{f.hint}</span>
          </span>
        </label>
      ))}
      {canEdit && (
        <button type="submit" disabled={pending} className="rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      )}
    </form>
  );
}

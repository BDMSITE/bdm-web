"use client";

import { useActionState } from "react";
import { Bell } from "lucide-react";
import { createAlertAction, type ActionState } from "@/lib/actions/compte";

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function AlerteForm({ types }: { types: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createAlertAction, {});

  return (
    <form action={action} className="space-y-4 border-2 border-primary p-4">
      <p className="font-bold">Créer une alerte</p>

      {state.error && (
        <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error}</p>
      )}
      {state.ok && (
        <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">Alerte créée.</p>
      )}

      <div>
        <label htmlFor="keywords" className="mb-1 block text-sm font-bold">Mots-clés *</label>
        <input id="keywords" name="keywords" required placeholder="Santé, Montréal, Retour au pays" className={INPUT} />
        <p className="mt-1 text-xs text-muted">Séparés par des virgules, 10 maximum.</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Types de contenus *</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {types.map((t) => (
            <label key={t.value} className="flex items-center gap-1.5 whitespace-nowrap text-sm">
              <input type="checkbox" name="types" value={t.value} defaultChecked className="h-4 w-4 accent-primary" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="frequency" className="mb-1 block text-sm font-bold">Fréquence</label>
          <select id="frequency" name="frequency" defaultValue="DAILY" className="rounded border border-line bg-paper px-3 py-2 text-sm">
            <option value="DAILY">Quotidienne (chaque matin, s&apos;il y a du nouveau)</option>
          </select>
        </div>
        <button type="submit" disabled={pending} className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          <Bell aria-hidden className="mr-1.5 inline h-4 w-4" /> {pending ? "Création…" : "Créer l'alerte"}
        </button>
      </div>
    </form>
  );
}

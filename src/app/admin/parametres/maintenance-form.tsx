"use client";

import { useActionState } from "react";
import { setMaintenanceAction, type AdminActionState } from "@/lib/actions/admin";

/* Interrupteur du mode maintenance : ferme le site aux visiteurs (page d'attente),
   l'équipe connectée continue de voir le site et le back-office. */

export function MaintenanceForm({ on, message, canEdit }: { on: boolean; message: string; canEdit: boolean }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(setMaintenanceAction, {});
  return (
    <form action={action} className="space-y-3 p-4">
      {state.error && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2 text-sm text-primary-dark">{state.message}</p>}
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="on" defaultChecked={on} disabled={!canEdit} className="mt-0.5 h-5 w-5 accent-danger" />
        <span>
          <span className="block font-bold">Fermer le site aux visiteurs</span>
          <span className="block text-xs text-muted">Toutes les pages publiques affichent la page d&apos;attente. La connexion et l&apos;administration restent ouvertes ; l&apos;équipe connectée voit le site normalement.</span>
        </span>
      </label>
      <div>
        <label htmlFor="maintenance-message" className="mb-1 block text-xs font-bold">Message affiché aux visiteurs</label>
        <textarea id="maintenance-message" name="message" rows={2} maxLength={300} defaultValue={message} disabled={!canEdit} placeholder="Nous améliorons le site : retour très bientôt." className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      </div>
      {canEdit && (
        <button type="submit" disabled={pending} className="rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Enregistrement…" : "Appliquer"}
        </button>
      )}
    </form>
  );
}

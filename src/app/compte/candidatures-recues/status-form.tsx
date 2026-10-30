"use client";

import { useActionState } from "react";
import { setApplicationStatusAction, type RelayState } from "@/lib/actions/messages";

/* Le recruteur fait avancer une candidature : le candidat voit le statut dans « Mes candidatures ». */

const OPTIONS = [
  { value: "sent", label: "Reçue" },
  { value: "viewed", label: "CV consulté" },
  { value: "interview", label: "Entretien proposé" },
  { value: "declined", label: "Non retenue" },
];

export function StatusForm({ applicationId, status }: { applicationId: string; status: string }) {
  const [state, action, pending] = useActionState<RelayState, FormData>(setApplicationStatusAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2 text-xs">
      <input type="hidden" name="applicationId" value={applicationId} />
      <label htmlFor={`st-${applicationId}`} className="font-bold">Statut</label>
      <select id={`st-${applicationId}`} name="status" defaultValue={status} className="rounded border border-line bg-paper px-2 py-1 text-xs">
        {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button type="submit" disabled={pending} className="rounded border border-primary px-2.5 py-1 font-bold text-primary hover:bg-primary hover:text-white disabled:opacity-60">
        {pending ? "…" : "Mettre à jour"}
      </button>
      {state.ok && <span className="text-primary-dark">Statut enregistré, le candidat le voit.</span>}
      {state.error && <span className="text-danger">{state.error}</span>}
    </form>
  );
}

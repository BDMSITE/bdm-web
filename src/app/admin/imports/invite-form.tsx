"use client";

import { useActionState } from "react";
import { sendInvitationsAction, type InviteState } from "@/lib/actions/import";

export function InviteForm({ aInviter }: { aInviter: number }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(sendInvitationsAction, {});

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      {state.error && <span className="text-sm text-danger">{state.error}</span>}
      {state.envoyees !== undefined && (
        <span className="text-sm text-ink-2">
          {state.envoyees} invitation{state.envoyees > 1 ? "s" : ""} envoyée{state.envoyees > 1 ? "s" : ""}
          {state.erreurs ? `, ${state.erreurs} en erreur` : ""}
        </span>
      )}
      <select name="lot" defaultValue="50" aria-label="Taille du lot" className="rounded border border-line bg-paper px-2 py-2 text-sm">
        {[10, 50, 100, 250].map((n) => (
          <option key={n} value={n}>{n} par envoi</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending || aInviter === 0}
        className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Envoyer les invitations"}
      </button>
    </form>
  );
}

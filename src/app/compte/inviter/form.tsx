"use client";

import { useActionState } from "react";
import { inviteFriendsAction, type InviteFriendsState } from "@/lib/actions/inviter";

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function InviteForm() {
  const [state, action, pending] = useActionState<InviteFriendsState, FormData>(inviteFriendsAction, {});
  return (
    <form action={action} className="space-y-4 border border-line p-5">
      {state.error && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">{state.message}</p>}
      <div>
        <label htmlFor="emails" className="mb-1 block text-sm font-bold">Adresses e-mail (jusqu&apos;à 5, séparées par des virgules ou des retours à la ligne)</label>
        <textarea id="emails" name="emails" rows={3} required placeholder="amina@exemple.com, koffi@exemple.com" className={INPUT} />
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-bold">Un mot de vous <span className="font-normal text-muted">(facultatif)</span></label>
        <textarea id="message" name="message" rows={3} maxLength={400} placeholder="J'ai rejoint le réseau de la diaspora, viens, on y trouve des offres et des événements près de chez nous." className={INPUT} />
      </div>
      <button type="submit" disabled={pending} className="rounded bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
        {pending ? "Envoi…" : "Envoyer les invitations"}
      </button>
      <p className="text-xs text-muted">20 invitations par jour maximum. Les personnes déjà inscrites ne reçoivent rien.</p>
    </form>
  );
}

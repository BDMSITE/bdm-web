"use client";

import { useActionState } from "react";
import { activateMembershipManualAction, type AdminActionState } from "@/lib/actions/admin";

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function ManualMembershipForm() {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(activateMembershipManualAction, {});
  return (
    <form action={action} className="space-y-3 p-4" key={state.ok ? "ok" : "edit"}>
      {state.error && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2 text-sm text-primary-dark">{state.message}</p>}
      <div>
        <label htmlFor="m-email" className="mb-1 block text-xs font-bold">E-mail du membre</label>
        <input id="m-email" name="email" type="email" required placeholder="membre@exemple.org" className={INPUT} />
      </div>
      <div>
        <label htmlFor="m-plan" className="mb-1 block text-xs font-bold">Formule</label>
        <select id="m-plan" name="plan" defaultValue="ANNUEL" className={INPUT}>
          <option value="ANNUEL">Adhésion annuelle (payée hors ligne)</option>
          <option value="ETUDIANT">Tarif réduit jeunes / étudiants (payé hors ligne)</option>
          <option value="HONNEUR">Membre d&apos;honneur (offerte)</option>
        </select>
      </div>
      <div>
        <label htmlFor="m-montant" className="mb-1 block text-xs font-bold">Montant reçu <span className="font-normal text-muted">(facultatif, ex. « 20 € » ou « 13 120 FCFA »)</span></label>
        <input id="m-montant" name="montant" maxLength={40} className={INPUT} />
      </div>
      <div>
        <label htmlFor="m-note" className="mb-1 block text-xs font-bold">Note interne <span className="font-normal text-muted">(facultatif)</span></label>
        <input id="m-note" name="note" maxLength={300} placeholder="Virement reçu le…, cotisation réglée à l'AG…" className={INPUT} />
      </div>
      <button type="submit" disabled={pending} className="rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
        {pending ? "Activation…" : "Activer l'adhésion"}
      </button>
    </form>
  );
}

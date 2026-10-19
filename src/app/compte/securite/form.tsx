"use client";

import { useActionState } from "react";
import { changePasswordAction, type ActionState } from "@/lib/actions/compte";

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function PasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(changePasswordAction, {});

  return (
    <form action={action} className="border border-line p-5" key={state.ok ? "ok" : "edit"}>
      <p className="font-bold">Changer mon mot de passe</p>

      {state.error && (
        <p role="alert" className="mt-3 rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error}</p>
      )}
      {state.ok && (
        <p role="status" className="mt-3 rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">Mot de passe mis à jour.</p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="current" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Mot de passe actuel</label>
          <input id="current" name="current" type="password" required autoComplete="current-password" className={INPUT} />
        </div>
        <div>
          <label htmlFor="next" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Nouveau mot de passe</label>
          <input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" className={INPUT} />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Confirmer</label>
          <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className={INPUT} />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">8 caractères minimum.</p>
      <button type="submit" disabled={pending} className="mt-4 rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
        {pending ? "Mise à jour…" : "Mettre à jour"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { PasswordInput } from "@/components/site/password-input";
import { changePasswordAction, setPasswordAction, type ActionState } from "@/lib/actions/compte";

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
          <PasswordInput id="current" name="current" required autoComplete="current-password" className={INPUT} />
        </div>
        <div>
          <label htmlFor="next" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Nouveau mot de passe</label>
          <PasswordInput id="next" name="next" required minLength={8} autoComplete="new-password" className={INPUT} />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">Confirmer</label>
          <PasswordInput id="confirm" name="confirm" required minLength={8} autoComplete="new-password" className={INPUT} />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">8 caractères minimum.</p>
      <button type="submit" disabled={pending} className="mt-4 rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
        {pending ? "Mise à jour…" : "Mettre à jour"}
      </button>
    </form>
  );
}

/* Premier mot de passe pour un compte qui n'en a pas (lien magique, import). */
export function SetPasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(setPasswordAction, {});
  return (
    <form action={action} className="border border-line p-5" key={state.ok ? "ok" : "edit"}>
      <p className="font-bold">Définir un mot de passe</p>
      <p className="mt-1 text-sm text-ink-2">Ce compte se connecte par lien envoyé par e-mail. Un mot de passe vous permettra aussi de vous connecter directement.</p>
      {state.error && <p role="alert" className="mt-3 rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="mt-3 rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">Mot de passe enregistré.</p>}
      {!state.ok && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="set-next" className="mb-1 block text-sm font-bold">Mot de passe <span className="font-normal text-muted">(8 caractères min.)</span></label>
            <PasswordInput id="set-next" name="next" required minLength={8} autoComplete="new-password" className={INPUT} />
          </div>
          <div>
            <label htmlFor="set-confirm" className="mb-1 block text-sm font-bold">Confirmer</label>
            <PasswordInput id="set-confirm" name="confirm" required autoComplete="new-password" className={INPUT} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={pending} className="rounded bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        </div>
      )}
    </form>
  );
}

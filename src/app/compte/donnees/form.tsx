"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAccountAction, type ActionState } from "@/lib/actions/compte";
import { PasswordInput } from "@/components/site/password-input";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(deleteAccountAction, {});

  return (
    <form action={action} className="border-2 border-danger bg-danger-light p-5">
      <p className="font-bold text-danger">Supprimer mon compte</p>
      <p className="mt-1 text-sm text-ink">
        Votre compte est désactivé immédiatement : votre adresse e-mail est anonymisée, votre mot de passe effacé, vos
        alertes supprimées et votre profil retiré de l&apos;annuaire. Cette action est définitive.
      </p>

      {state.error && (
        <p role="alert" className="mt-3 rounded border border-danger bg-paper px-3 py-2.5 text-sm text-danger">{state.error}</p>
      )}

      <label htmlFor="del-password" className="mt-4 block text-sm font-bold">Votre mot de passe (si votre compte en a un)</label>
      <div className="mt-1 sm:w-64">
        <PasswordInput id="del-password" name="password" autoComplete="current-password" className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-danger focus:outline-none" />
      </div>
      <label htmlFor="confirm" className="mt-4 block text-sm font-bold">
        Pour confirmer, tapez <span className="font-mono">SUPPRIMER</span>
      </label>
      <div className="mt-1 flex flex-wrap gap-2">
        <input
          id="confirm"
          name="confirm"
          required
          autoComplete="off"
          className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-danger focus:outline-none sm:w-64"
        />
        <button type="submit" disabled={pending} className="whitespace-nowrap rounded bg-danger px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
          <Trash2 aria-hidden className="mr-1.5 inline h-4 w-4" /> {pending ? "Suppression…" : "Supprimer définitivement"}
        </button>
      </div>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmTwoFactorAction, disableTwoFactorAction, type ActionState } from "@/lib/actions/compte";

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function ConfirmTwoFactorForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(confirmTwoFactorAction, {});
  if (state.ok) {
    return (
      <div className="mt-3 rounded border border-primary bg-primary-faint p-4">
        <p className="font-bold text-primary-dark">Double authentification activée.</p>
        <Link href="/compte/securite" className="mt-2 inline-block text-sm font-bold text-primary hover:underline">Retour à la sécurité →</Link>
      </div>
    );
  }
  return (
    <form action={action} className="mt-3 flex flex-wrap items-start gap-3">
      <input name="code" inputMode="numeric" autoComplete="one-time-code" required placeholder="000 000" className="w-40 rounded border border-line bg-paper px-3 py-2 text-center font-mono text-lg tracking-[0.3em] focus:border-primary focus:outline-none" />
      <button type="submit" disabled={pending} className="rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">{pending ? "Vérification…" : "Confirmer"}</button>
      {state.error && <p role="alert" className="w-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}

export function DisableTwoFactorForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(disableTwoFactorAction, {});
  if (state.ok) return <p role="status" className="text-sm font-bold text-primary-dark">Double authentification désactivée.</p>;
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <input name="password" type="password" autoComplete="current-password" required placeholder="Mot de passe" className={INPUT} />
      <input name="code" inputMode="numeric" autoComplete="one-time-code" required placeholder="Code à 6 chiffres" className={INPUT} />
      <button type="submit" disabled={pending} className="rounded border-2 border-line px-4 py-2 text-sm font-bold text-ink-2 hover:border-danger hover:text-danger disabled:opacity-60">Désactiver</button>
      {state.error && <p role="alert" className="text-sm text-danger sm:col-span-3">{state.error}</p>}
    </form>
  );
}

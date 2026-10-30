"use client";

import { useActionState } from "react";
import { blockUserAction, unblockUserAction, type RelayState } from "@/lib/actions/messages";

/* Bloquer / débloquer un membre : un membre bloqué ne peut plus vous écrire. */

export function BlockButton({ userId, name, blocked }: { userId: string; name: string; blocked: boolean }) {
  const [state, action, pending] = useActionState<RelayState, FormData>(blocked ? unblockUserAction : blockUserAction, {});
  return (
    <form action={action} onSubmit={(e) => { if (!blocked && !window.confirm(`Bloquer ${name} ? Cette personne ne pourra plus vous écrire. Vous pourrez la débloquer ici.`)) e.preventDefault(); }} className="inline-flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" disabled={pending} className={`text-xs font-semibold hover:underline disabled:opacity-60 ${blocked ? "text-primary" : "text-danger"}`}>
        {pending ? "…" : blocked ? "Débloquer" : "Bloquer ce membre"}
      </button>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
    </form>
  );
}

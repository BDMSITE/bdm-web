"use client";

import { useActionState } from "react";
import type { AdminActionState } from "@/lib/actions/admin";

/* Bouton d'action du back-office : un mini-formulaire qui appelle une action
   serveur avec des champs cachés (id, décision…) et affiche le retour. */

type Action = (prev: AdminActionState, formData: FormData) => Promise<AdminActionState>;

const TONES = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  neutral: "border border-line text-ink-2 hover:border-primary hover:text-primary",
  danger: "border border-danger text-danger hover:bg-danger hover:text-white",
} as const;

export function ActionButton({
  action,
  fields,
  label,
  tone = "neutral",
  confirm,
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  tone?: keyof typeof TONES;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(action, {});
  return (
    <form
      action={formAction}
      className="inline-flex flex-col items-end gap-1"
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        disabled={pending}
        className={`whitespace-nowrap rounded px-2.5 py-1 text-xs font-bold disabled:opacity-50 ${TONES[tone]}`}
      >
        {pending ? "…" : label}
      </button>
      {state.error && (
        <span role="alert" className="max-w-[220px] text-right text-xs text-danger">{state.error}</span>
      )}
    </form>
  );
}

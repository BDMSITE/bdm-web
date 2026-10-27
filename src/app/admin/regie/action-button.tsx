"use client";

import { useActionState } from "react";
import type { RegieState } from "@/lib/actions/regie";

/* Bouton d'action de la régie (même principe que ActionButton de l'admin,
   avec l'état propre aux actions de régie). */

type Action = (prev: RegieState, formData: FormData) => Promise<RegieState>;
const TONES = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  neutral: "border border-line text-ink-2 hover:border-primary hover:text-primary",
  danger: "border border-danger text-danger hover:bg-danger hover:text-white",
} as const;

export function RegieActionButton({ action, fields, label, tone = "neutral" }: { action: Action; fields: Record<string, string>; label: string; tone?: keyof typeof TONES }) {
  const [state, formAction, pending] = useActionState<RegieState, FormData>(action, {});
  return (
    <form action={formAction} className="inline">
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button type="submit" disabled={pending} className={`whitespace-nowrap rounded px-2.5 py-1 text-xs font-bold disabled:opacity-60 ${TONES[tone]}`}>
        {pending ? "…" : label}
      </button>
      {state.error && <span role="alert" className="ml-2 text-xs text-danger">{state.error}</span>}
    </form>
  );
}

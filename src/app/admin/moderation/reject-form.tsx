"use client";

import { useActionState, useState } from "react";
import { moderateContentAction, type AdminActionState } from "@/lib/actions/admin";

/* Refus avec motif : le motif est enregistré sur le contenu et envoyé à l'auteur. */

export function RejectForm({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminActionState, FormData>(moderateContentAction, {});
  if (state.ok) return <span className="text-xs text-primary-dark">{state.message}</span>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="whitespace-nowrap rounded border border-danger px-2.5 py-1 text-xs font-bold text-danger hover:bg-danger hover:text-white">
        Refuser
      </button>
    );
  }
  return (
    <form action={action} className="w-64 space-y-1.5 text-left">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value="reject" />
      {state.error && <p role="alert" className="text-xs text-danger">{state.error}</p>}
      <label htmlFor={`motif-${id}`} className="block text-xs font-bold">Motif envoyé à l&apos;auteur</label>
      <textarea id={`motif-${id}`} name="reason" rows={3} maxLength={600} placeholder="Ex. : ajoutez la ville et retirez le numéro de téléphone du texte." className="w-full rounded border border-line bg-paper px-2 py-1.5 text-xs focus:border-primary focus:outline-none" />
      <div className="flex gap-1.5">
        <button type="submit" disabled={pending} className="rounded bg-danger px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60">
          {pending ? "…" : `Refuser « ${title.slice(0, 24)}${title.length > 24 ? "…" : ""} »`}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded border border-line px-2.5 py-1 text-xs font-bold text-ink-2">Annuler</button>
      </div>
    </form>
  );
}

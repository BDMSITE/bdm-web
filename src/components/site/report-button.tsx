"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import { reportContentAction, type ReportState } from "@/lib/actions/report";

/* « Signaler ce contenu » : repliable, réservé aux membres connectés (lien de connexion sinon). */

export function ReportButton({ contentId, connected, loginHref }: { contentId: string; connected: boolean; loginHref: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ReportState, FormData>(reportContentAction, {});
  if (state.ok) return <p role="status" className="text-xs text-primary-dark">Merci, votre signalement est transmis à la modération.</p>;
  if (!connected) {
    return (
      <Link href={loginHref} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-danger">
        <Flag aria-hidden className="h-3.5 w-3.5" /> Signaler ce contenu (membres connectés)
      </Link>
    );
  }
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-danger">
        <Flag aria-hidden className="h-3.5 w-3.5" /> Signaler ce contenu
      </button>
      {open && (
        <form action={action} className="mt-2 max-w-md space-y-2">
          <input type="hidden" name="contentId" value={contentId} />
          {state.error && <p role="alert" className="text-xs text-danger">{state.error}</p>}
          <label htmlFor="report-reason" className="block text-xs font-bold">Pourquoi ? (contenu faux, offensant, arnaque, doublon…)</label>
          <textarea id="report-reason" name="reason" rows={3} required minLength={10} maxLength={800} className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          <button type="submit" disabled={pending} className="rounded border border-danger px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger hover:text-white disabled:opacity-60">
            {pending ? "Envoi…" : "Envoyer le signalement"}
          </button>
        </form>
      )}
    </div>
  );
}

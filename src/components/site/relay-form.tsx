"use client";

import { useActionState } from "react";
import { sendMessageAction, applyAction, type RelayState } from "@/lib/actions/messages";

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function RelayForm({ toProfileId, contentId, parentId, label = "Envoyer", placeholder = "Votre message…", compact = false }: {
  toProfileId?: string; contentId?: string; parentId?: string; label?: string; placeholder?: string; compact?: boolean;
}) {
  const [state, action, pending] = useActionState<RelayState, FormData>(sendMessageAction, {});
  if (state.ok) {
    return <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">Message envoyé. La réponse arrivera dans votre espace « Mes messages ».</p>;
  }
  return (
    <form action={action} className="space-y-3">
      {toProfileId && <input type="hidden" name="toProfileId" value={toProfileId} />}
      {contentId && <input type="hidden" name="contentId" value={contentId} />}
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      {state.error && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2 text-sm text-danger">{state.error}</p>}
      <textarea name="body" required minLength={10} maxLength={3000} rows={compact ? 3 : 5} placeholder={placeholder} className={INPUT} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Envoi…" : label}
        </button>
        <span className="text-xs text-muted">Votre e-mail n&apos;est jamais transmis.</span>
      </div>
    </form>
  );
}

export function ApplyForm({ contentId, cvUrl }: { contentId: string; cvUrl: string | null }) {
  const [state, action, pending] = useActionState<RelayState, FormData>(applyAction, {});
  if (state.ok) {
    return <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">Candidature envoyée. Suivez-la dans « Mes candidatures ».</p>;
  }
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="contentId" value={contentId} />
      {state.error && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2 text-sm text-danger">{state.error}</p>}
      <div>
        <label htmlFor="apply-message" className="mb-1 block text-sm font-bold">Votre message au recruteur *</label>
        <textarea id="apply-message" name="message" required minLength={20} maxLength={3000} rows={5} placeholder="Présentez-vous, votre parcours et vos motivations…" className={INPUT} />
      </div>
      <div>
        <label htmlFor="apply-cv" className="mb-1 block text-sm font-bold">Lien vers votre CV</label>
        <input id="apply-cv" name="cvUrl" type="url" defaultValue={cvUrl ?? ""} placeholder="https://" className={INPUT} />
        <p className="mt-1 text-xs text-muted">{cvUrl ? "Pré-rempli depuis votre profil." : "Ajoutez votre CV dans Mon espace → Mon CV pour le pré-remplir."}</p>
      </div>
      <button type="submit" disabled={pending} className="rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
        {pending ? "Envoi…" : "Envoyer ma candidature"}
      </button>
    </form>
  );
}

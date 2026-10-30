"use client";

import { useActionState } from "react";
import { proposeExpertAction, withdrawExpertAction, type MemberServiceState } from "@/lib/actions/services-membre";
import { EXPERT_DOMAINS, EXPERT_MODES } from "@/lib/competences";

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function ExpertForm({ values, status }: { values: { domain: string; modes: string[]; pitch: string }; status: string }) {
  const [state, action, pending] = useActionState<MemberServiceState, FormData>(proposeExpertAction, {});
  const [wState, wAction, wPending] = useActionState<MemberServiceState, FormData>(() => withdrawExpertAction(), {});
  const msg = state.error ? null : (state.message ?? wState.message);
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-5 border border-line p-5">
        {(state.error ?? wState.error) && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error ?? wState.error}</p>}
        {msg && <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">{msg}</p>}
        <div>
          <label htmlFor="domain" className="mb-1 block text-sm font-bold">Domaine principal *</label>
          <select id="domain" name="domain" required defaultValue={values.domain} className={INPUT}>
            <option value="">Choisir…</option>
            {EXPERT_DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-bold">Comment je peux contribuer *</legend>
          <div className="space-y-2">
            {EXPERT_MODES.map((m) => (
              <label key={m.value} className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="modes" value={m.value} defaultChecked={values.modes.includes(m.value)} className="mt-0.5 h-4 w-4 accent-primary" />
                {m.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="pitch" className="mb-1 block text-sm font-bold">Ce que je propose *</label>
          <textarea id="pitch" name="pitch" rows={6} required minLength={40} maxLength={1200} defaultValue={values.pitch} placeholder="Votre métier, vos années d'expérience, le type de projet que vous pouvez aider, vos disponibilités (soirs, week-ends, un mois par an…)." className={INPUT} />
          <p className="mt-1 text-xs text-muted">Texte relu par le HCBE, affiché tel quel dans la rubrique. 1 200 caractères maximum.</p>
        </div>
        <label className="flex items-start gap-2 text-xs text-ink-2">
          <input type="checkbox" name="charter" required className="mt-0.5 h-4 w-4 accent-primary" />
          J&apos;accepte que le HCBE relise ma proposition et publie mon nom, ma ville, mon domaine et ce texte dans la rubrique Compétences. Mon e-mail reste privé. *
        </label>
        <button type="submit" disabled={pending} className="rounded bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Envoi…" : status === "NONE" || status === "REJECTED" ? "Proposer mes compétences" : "Mettre à jour ma proposition"}
        </button>
      </form>
      {status !== "NONE" && (
        <form action={wAction}>
          <button type="submit" disabled={wPending} className="text-sm font-semibold text-danger hover:underline disabled:opacity-60">
            {wPending ? "Retrait…" : "Retirer ma proposition"}
          </button>
        </form>
      )}
    </div>
  );
}

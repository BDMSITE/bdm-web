"use client";

import { useActionState } from "react";
import { saveHostingAction, withdrawHostingAction, type MemberServiceState } from "@/lib/actions/services-membre";
import { HOSTING_KINDS, HOSTING_AUDIENCES } from "@/lib/competences";

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

type Values = { kind: string; audience: string[]; city: string; country: string; capacity: string; duration: string; conditions: string };

export function HostingForm({ values, exists }: { values: Values; exists: boolean }) {
  const [state, action, pending] = useActionState<MemberServiceState, FormData>(saveHostingAction, {});
  const [wState, wAction, wPending] = useActionState<MemberServiceState, FormData>(() => withdrawHostingAction(), {});
  const msg = state.error ? null : (state.message ?? wState.message);
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-5 border border-line p-5">
        {(state.error ?? wState.error) && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error ?? wState.error}</p>}
        {msg && <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">{msg}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="kind" className="mb-1 block text-sm font-bold">Type d&apos;accueil *</label>
            <select id="kind" name="kind" required defaultValue={values.kind} className={INPUT}>
              <option value="">Choisir…</option>
              {HOSTING_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="capacity" className="mb-1 block text-sm font-bold">Nombre de personnes</label>
            <input id="capacity" name="capacity" type="number" min={1} max={20} defaultValue={values.capacity} className={INPUT} />
          </div>
          <div>
            <label htmlFor="city" className="mb-1 block text-sm font-bold">Ville *</label>
            <input id="city" name="city" required defaultValue={values.city} autoComplete="address-level2" className={INPUT} />
          </div>
          <div>
            <label htmlFor="country" className="mb-1 block text-sm font-bold">Pays *</label>
            <input id="country" name="country" required defaultValue={values.country} autoComplete="country-name" className={INPUT} />
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-bold">Qui j&apos;accueille *</legend>
          <div className="space-y-2">
            {HOSTING_AUDIENCES.map((a) => (
              <label key={a.value} className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="audience" value={a.value} defaultChecked={values.audience.includes(a.value)} className="mt-0.5 h-4 w-4 accent-primary" />
                {a.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="duration" className="mb-1 block text-sm font-bold">Durée possible</label>
          <input id="duration" name="duration" maxLength={120} defaultValue={values.duration} placeholder="Quelques nuits, un mois, un semestre…" className={INPUT} />
        </div>
        <div>
          <label htmlFor="conditions" className="mb-1 block text-sm font-bold">Conditions *</label>
          <textarea id="conditions" name="conditions" rows={5} required minLength={30} maxLength={1500} defaultValue={values.conditions} placeholder="Participation aux frais ou gratuité, règles de la maison, transports à proximité, ce que vous attendez de la personne accueillie." className={INPUT} />
        </div>
        <label className="flex items-start gap-2 text-xs text-ink-2">
          <input type="checkbox" name="charter" required className="mt-0.5 h-4 w-4 accent-primary" />
          J&apos;accepte la charte de l&apos;accueil : le HCBE vérifie ma fiche, la mise en relation passe par la messagerie du site, chacun reste responsable de l&apos;accueil qu&apos;il propose ou accepte. Mon adresse exacte et mon e-mail ne sont jamais publiés. *
        </label>
        <button type="submit" disabled={pending} className="rounded bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Envoi…" : exists ? "Mettre à jour ma fiche" : "Envoyer ma fiche au HCBE"}
        </button>
      </form>
      {exists && (
        <form action={wAction}>
          <button type="submit" disabled={wPending} className="text-sm font-semibold text-danger hover:underline disabled:opacity-60">
            {wPending ? "Retrait…" : "Retirer ma fiche"}
          </button>
        </form>
      )}
    </div>
  );
}

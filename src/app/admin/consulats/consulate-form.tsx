"use client";

import { useActionState } from "react";
import { saveConsulateAction, deleteConsulateAction, type AdminActionState } from "@/lib/actions/admin";
import { PAYS, PAYS_FREQUENTS } from "@/lib/pays";

/* Fiche d'une représentation du Bénin (ambassade, consulat, consulat honoraire) : création ou édition. */

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";
const KINDS = [
  { value: "AMBASSADE", label: "Ambassade" },
  { value: "CONSULAT", label: "Consulat général / consulat" },
  { value: "CONSULAT_HONORAIRE", label: "Consulat honoraire" },
  { value: "MISSION", label: "Mission permanente / représentation" },
];

export type ConsulateValues = { id?: string; country: string; city: string; kind: string; name: string; address: string; phone: string; email: string; website: string; hours: string; notes: string };

export function ConsulateForm({ values }: { values?: ConsulateValues }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(saveConsulateAction, {});
  const [del, delAction, deleting] = useActionState<AdminActionState, FormData>(deleteConsulateAction, {});
  const v = values ?? { country: "", city: "", kind: "AMBASSADE", name: "", address: "", phone: "", email: "", website: "", hours: "", notes: "" };
  if (del.ok) return <p className="p-4 text-sm text-primary-dark">{del.message}</p>;
  const suggestions = [...PAYS_FREQUENTS, ...PAYS.filter((p) => !PAYS_FREQUENTS.includes(p))];
  return (
    <form action={action} className="space-y-3 p-4">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      {(state.error ?? del.error) && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2 text-sm text-danger">{state.error ?? del.error}</p>}
      {state.ok && <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2 text-sm text-primary-dark">{state.message}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`c-country-${v.id ?? "new"}`} className="mb-1 block text-xs font-bold">Pays couvert *</label>
          <input id={`c-country-${v.id ?? "new"}`} name="country" list="consulat-pays" required maxLength={80} defaultValue={v.country} className={INPUT} />
          <datalist id="consulat-pays">{suggestions.map((p) => <option key={p} value={p} />)}</datalist>
        </div>
        <div>
          <label htmlFor={`c-city-${v.id ?? "new"}`} className="mb-1 block text-xs font-bold">Ville *</label>
          <input id={`c-city-${v.id ?? "new"}`} name="city" required maxLength={80} defaultValue={v.city} className={INPUT} />
        </div>
        <div>
          <label htmlFor={`c-kind-${v.id ?? "new"}`} className="mb-1 block text-xs font-bold">Type *</label>
          <select id={`c-kind-${v.id ?? "new"}`} name="kind" defaultValue={v.kind} className={INPUT}>
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor={`c-name-${v.id ?? "new"}`} className="mb-1 block text-xs font-bold">Nom officiel *</label>
          <input id={`c-name-${v.id ?? "new"}`} name="name" required maxLength={160} defaultValue={v.name} placeholder="Ambassade de la République du Bénin en France" className={INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`c-address-${v.id ?? "new"}`} className="mb-1 block text-xs font-bold">Adresse</label>
          <input id={`c-address-${v.id ?? "new"}`} name="address" maxLength={300} defaultValue={v.address} className={INPUT} />
        </div>
        <div>
          <label htmlFor={`c-phone-${v.id ?? "new"}`} className="mb-1 block text-xs font-bold">Téléphone</label>
          <input id={`c-phone-${v.id ?? "new"}`} name="phone" maxLength={60} defaultValue={v.phone} className={INPUT} />
        </div>
        <div>
          <label htmlFor={`c-email-${v.id ?? "new"}`} className="mb-1 block text-xs font-bold">E-mail officiel</label>
          <input id={`c-email-${v.id ?? "new"}`} name="email" type="email" maxLength={120} defaultValue={v.email} className={INPUT} />
        </div>
        <div>
          <label htmlFor={`c-website-${v.id ?? "new"}`} className="mb-1 block text-xs font-bold">Site web</label>
          <input id={`c-website-${v.id ?? "new"}`} name="website" type="url" maxLength={300} defaultValue={v.website} placeholder="https://" className={INPUT} />
        </div>
        <div>
          <label htmlFor={`c-hours-${v.id ?? "new"}`} className="mb-1 block text-xs font-bold">Horaires</label>
          <input id={`c-hours-${v.id ?? "new"}`} name="hours" maxLength={160} defaultValue={v.hours} placeholder="Lun–ven 9 h–16 h" className={INPUT} />
        </div>
        <div className="sm:col-span-3">
          <label htmlFor={`c-notes-${v.id ?? "new"}`} className="mb-1 block text-xs font-bold">Notes (prise de rendez-vous, documents, remarques)</label>
          <textarea id={`c-notes-${v.id ?? "new"}`} name="notes" rows={2} maxLength={600} defaultValue={v.notes} className={INPUT} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Enregistrement…" : v.id ? "Enregistrer" : "Ajouter la représentation"}
        </button>
        {v.id && (
          <button type="submit" formAction={delAction} disabled={deleting} onClick={(e) => { if (!window.confirm(`Supprimer « ${v.name} » ?`)) e.preventDefault(); }} className="text-sm font-semibold text-danger hover:underline disabled:opacity-60">
            {deleting ? "Suppression…" : "Supprimer"}
          </button>
        )}
      </div>
    </form>
  );
}

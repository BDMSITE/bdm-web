"use client";

import { useActionState } from "react";
import { saveSectionAction, deleteSectionAction, type AdminActionState } from "@/lib/actions/admin";
import { PAYS, PAYS_FREQUENTS } from "@/lib/pays";

/* Section locale du HCBE : pays, ville, nom, présentation, membre responsable (par son e-mail de compte), site. */

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export type SectionValues = { id?: string; country: string; city: string; name: string; description: string; contactEmail: string; website: string };

export function SectionForm({ values }: { values?: SectionValues }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(saveSectionAction, {});
  const [del, delAction, deleting] = useActionState<AdminActionState, FormData>(deleteSectionAction, {});
  const v = values ?? { country: "", city: "", name: "", description: "", contactEmail: "", website: "" };
  const k = v.id ?? "new";
  if (del.ok) return <p className="p-4 text-sm text-primary-dark">{del.message}</p>;
  const suggestions = [...PAYS_FREQUENTS, ...PAYS.filter((p) => !PAYS_FREQUENTS.includes(p))];
  return (
    <form action={action} className="space-y-3 p-4">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      {(state.error ?? del.error) && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2 text-sm text-danger">{state.error ?? del.error}</p>}
      {state.ok && <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2 text-sm text-primary-dark">{state.message}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`s-country-${k}`} className="mb-1 block text-xs font-bold">Pays *</label>
          <input id={`s-country-${k}`} name="country" list="section-pays" required maxLength={80} defaultValue={v.country} className={INPUT} />
          <datalist id="section-pays">{suggestions.map((p) => <option key={p} value={p} />)}</datalist>
        </div>
        <div>
          <label htmlFor={`s-city-${k}`} className="mb-1 block text-xs font-bold">Ville / région</label>
          <input id={`s-city-${k}`} name="city" maxLength={80} defaultValue={v.city} placeholder="Toute la France, Montréal, Rhône-Alpes…" className={INPUT} />
        </div>
        <div>
          <label htmlFor={`s-name-${k}`} className="mb-1 block text-xs font-bold">Nom de la section *</label>
          <input id={`s-name-${k}`} name="name" required maxLength={160} defaultValue={v.name} placeholder="HCBE France" className={INPUT} />
        </div>
        <div className="sm:col-span-3">
          <label htmlFor={`s-desc-${k}`} className="mb-1 block text-xs font-bold">Présentation</label>
          <textarea id={`s-desc-${k}`} name="description" rows={2} maxLength={600} defaultValue={v.description} placeholder="Rôle de la section, permanences, activités." className={INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`s-contact-${k}`} className="mb-1 block text-xs font-bold">Responsable : e-mail de son compte membre <span className="font-normal text-muted">(jamais affiché, sert au formulaire relais)</span></label>
          <input id={`s-contact-${k}`} name="contactEmail" type="email" maxLength={120} defaultValue={v.contactEmail} className={INPUT} />
        </div>
        <div>
          <label htmlFor={`s-web-${k}`} className="mb-1 block text-xs font-bold">Site ou page</label>
          <input id={`s-web-${k}`} name="website" type="url" maxLength={300} defaultValue={v.website} placeholder="https://" className={INPUT} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Enregistrement…" : v.id ? "Enregistrer" : "Ajouter la section"}
        </button>
        {v.id && (
          <button type="submit" formAction={delAction} disabled={deleting} onClick={(e) => { if (!window.confirm(`Supprimer la section « ${v.name} » ?`)) e.preventDefault(); }} className="text-sm font-semibold text-danger hover:underline disabled:opacity-60">
            {deleting ? "Suppression…" : "Supprimer"}
          </button>
        )}
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { setUserRoleAction, addTeamMemberAction, type AdminActionState } from "@/lib/actions/admin";

/* Paramètres : attribution des rôles (administrateur uniquement).
   RoleSelect = select + Appliquer sur une ligne de l'équipe ;
   AddTeamMemberForm = ajouter un compte ACTIVE existant à l'équipe par e-mail. */

export const ROLE_OPTIONS = [
  { value: "USER", label: "Membre" },
  { value: "EDITOR", label: "Rédaction" },
  { value: "MODERATOR", label: "Modération" },
  { value: "REGIE", label: "Régie publicitaire" },
  { value: "ADMIN", label: "Administrateur" },
] as const;

const SELECT = "rounded border border-line bg-paper px-2 py-1 text-xs font-semibold focus:border-primary focus:outline-none";
const BTN = "whitespace-nowrap rounded border border-line px-2.5 py-1 text-xs font-bold text-ink-2 hover:border-primary hover:text-primary disabled:opacity-50";

function Retour({ state }: { state: AdminActionState }) {
  if (state.error) return <span role="alert" className="text-xs text-danger">{state.error}</span>;
  if (state.ok) return <span role="status" className="text-xs text-primary-dark">{state.message}</span>;
  return null;
}

export function RoleSelect({ id, role, self }: { id: string; role: string; self: boolean }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(setUserRoleAction, {});
  return (
    <form action={action} className="flex flex-col items-start gap-1">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-nowrap items-center gap-2">
        <select name="role" defaultValue={role} aria-label="Rôle" className={SELECT}>
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} disabled={self && o.value !== "ADMIN"}>{o.label}</option>
          ))}
        </select>
        <button type="submit" disabled={pending} className={BTN}>{pending ? "…" : "Appliquer"}</button>
      </div>
      <Retour state={state} />
    </form>
  );
}

export function AddTeamMemberForm() {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(addTeamMemberAction, {});
  return (
    <form action={action} noValidate className="flex flex-wrap items-end gap-3 px-4 py-3">
      <div className="min-w-[240px] flex-1">
        <label htmlFor="team-email" className="mb-1 block text-xs font-bold">E-mail d&apos;un compte existant</label>
        <input
          id="team-email"
          name="email"
          type="email"
          required
          maxLength={200}
          placeholder="prenom.nom@exemple.org"
          className="w-full rounded border border-line bg-paper px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="team-role" className="mb-1 block text-xs font-bold">Rôle</label>
        <select id="team-role" name="role" defaultValue="EDITOR" className="rounded border border-line bg-paper px-3 py-1.5 text-sm focus:border-primary focus:outline-none">
          {ROLE_OPTIONS.filter((o) => o.value !== "USER").map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="whitespace-nowrap rounded bg-primary px-4 py-1.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
      >
        {pending ? "…" : "Ajouter à l'équipe"}
      </button>
      <div className="basis-full"><Retour state={state} /></div>
    </form>
  );
}

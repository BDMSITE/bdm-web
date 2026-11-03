"use client";

import { useActionState } from "react";
import { HeartHandshake } from "lucide-react";
import { setHelpVolunteerAction, type ActionState } from "@/lib/actions/compte";

/* Volontaire pour l'entraide : prévenu par e-mail de chaque besoin publié dans sa ville. */

export function EntraideForm({ on, city }: { on: boolean; city: string | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(setHelpVolunteerAction, {});
  return (
    <form id="entraide" action={action} className="border-2 border-primary p-4">
      <p className="flex items-center gap-2 font-display text-lg font-bold"><HeartHandshake aria-hidden className="h-5 w-5 text-primary" /> Entraide près de chez moi</p>
      <p className="mt-1 text-sm text-ink-2">
        Recevez un e-mail à chaque <strong>besoin d&apos;aide</strong> publié par un membre dans votre ville{city ? ` (${city})` : ""} : hébergement d&apos;urgence, traduction, accompagnement administratif… Vous répondez par le formulaire relais, votre adresse reste cachée.
      </p>
      {!city && <p className="mt-2 text-sm text-danger">Indiquez d&apos;abord votre ville dans Mon profil public.</p>}
      <label className="mt-3 flex items-center gap-2.5 text-sm font-semibold">
        <input type="checkbox" name="helpVolunteer" defaultChecked={on} disabled={!city} className="h-4 w-4 accent-primary" />
        Je suis volontaire pour l&apos;entraide dans ma ville
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || !city} className="rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer"}</button>
        {state.ok && <span role="status" className="text-sm text-primary-dark">Choix enregistré.</span>}
        {state.error && <span role="alert" className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}

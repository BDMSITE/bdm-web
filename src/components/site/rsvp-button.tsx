"use client";

import { useActionState } from "react";
import { CalendarCheck } from "lucide-react";
import { toggleRsvpAction, type RsvpState } from "@/lib/actions/rsvp";

/* Bouton « J'y vais » + compteur de participants. Visiteur non connecté : lien vers la connexion. */

export function RsvpButton({ contentId, retour, going, count, connected }: { contentId: string; retour: string; going: boolean; count: number; connected: boolean }) {
  const [state, action, pending] = useActionState<RsvpState, FormData>(toggleRsvpAction, {});
  const isGoing = state.going ?? going;
  const n = state.count ?? count;
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="contentId" value={contentId} />
      <input type="hidden" name="retour" value={retour} />
      <button
        type="submit"
        disabled={pending}
        aria-pressed={isGoing}
        className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-bold disabled:opacity-60 ${isGoing ? "bg-primary text-white hover:bg-primary-dark" : "border-2 border-primary text-primary hover:bg-primary hover:text-white"}`}
      >
        <CalendarCheck aria-hidden className="h-4 w-4" />
        {pending ? "…" : isGoing ? "J'y vais ✓" : connected ? "J'y vais" : "J'y vais (se connecter)"}
      </button>
      <span className="text-sm text-ink-2">
        {n === 0 ? "Soyez le premier à vous annoncer." : `${n} participant${n > 1 ? "s" : ""} annoncé${n > 1 ? "s" : ""}`}
      </span>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
      {isGoing && !state.error && <span className="text-xs text-muted">Vous recevrez un rappel la veille.</span>}
    </form>
  );
}

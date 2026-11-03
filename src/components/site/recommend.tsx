"use client";

import { useActionState, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { recommendAction, deleteRecommendationAction, type RecoState } from "@/lib/actions/recommandations";

/* Formulaire « Je recommande » : un membre connecté laisse (ou retire) sa recommandation
   sur un autre membre ou une bonne adresse. Visiteur : lien vers la connexion. */

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export type MyReco = { id: string; text: string; status: "PUBLISHED" | "IN_MODERATION" | string } | null;

export function RecommendForm({ profileId, contentId, retour, mine, connected, cible }: { profileId?: string; contentId?: string; retour: string; mine: MyReco; connected: boolean; cible: string }) {
  const [state, action, pending] = useActionState<RecoState, FormData>(recommendAction, {});
  const [del, delAction, deleting] = useActionState<RecoState, FormData>(deleteRecommendationAction, {});
  const [edit, setEdit] = useState(false);

  if (!connected) {
    return (
      <p className="text-sm text-ink-2">
        <a href={`/connexion?callbackUrl=${encodeURIComponent(retour)}`} className="font-bold text-primary hover:underline">Connectez-vous</a> pour recommander {cible}.
      </p>
    );
  }
  if (state.ok) {
    return <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">{state.message}</p>;
  }
  if (del.ok) {
    return <p role="status" className="text-sm text-ink-2">{del.message}</p>;
  }
  if (mine && !edit) {
    return (
      <div className="text-sm">
        <p className="flex flex-wrap items-center gap-2">
          <ThumbsUp aria-hidden className="h-4 w-4 text-primary" />
          <span className="font-bold">Vous recommandez {cible}.</span>
          {mine.status === "IN_MODERATION" && <span className="rounded bg-accent-light px-2 py-0.5 text-xs font-semibold">En attente de relecture</span>}
        </p>
        <p className="mt-1 italic text-ink-2">« {mine.text} »</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setEdit(true)} className="font-bold text-primary hover:underline">Modifier</button>
          <form action={delAction} className="inline">
            <input type="hidden" name="id" value={mine.id} />
            <button type="submit" disabled={deleting} className="text-ink-2 hover:text-danger hover:underline disabled:opacity-60">{deleting ? "Retrait…" : "Retirer ma recommandation"}</button>
          </form>
        </div>
        {del.error && <p className="mt-1 text-xs text-danger">{del.error}</p>}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      {profileId && <input type="hidden" name="profileId" value={profileId} />}
      {contentId && <input type="hidden" name="contentId" value={contentId} />}
      <input type="hidden" name="retour" value={retour} />
      {state.error && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2 text-sm text-danger">{state.error}</p>}
      <div>
        <label htmlFor={`reco-${profileId ?? contentId}`} className="mb-1 block text-sm font-bold">Pourquoi recommandez-vous {cible} ?</label>
        <textarea id={`reco-${profileId ?? contentId}`} name="text" rows={3} required minLength={20} maxLength={400} defaultValue={mine?.text ?? ""} placeholder="Ce que vous avez apprécié, dans quel contexte, ce que vous diriez à un ami." className={INPUT} />
        <p className="mt-1 text-xs text-muted">20 à 400 caractères. Publiée avec votre nom de membre, sans votre e-mail.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          <ThumbsUp aria-hidden className="h-4 w-4" /> {pending ? "Envoi…" : mine ? "Enregistrer" : "Je recommande"}
        </button>
        {edit && <button type="button" onClick={() => setEdit(false)} className="text-sm text-ink-2 hover:underline">Annuler</button>}
      </div>
    </form>
  );
}

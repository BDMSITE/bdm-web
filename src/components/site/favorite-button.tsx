"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/lib/actions/favoris";

/* Bouton « Ajouter aux favoris / Retirer des favoris ». Réservé aux membres
   connectés : sans session, l'action renvoie vers /connexion.
   `compact` = icône seule (cartes, listes). */

export function FavoriteButton({ contentId, initial, compact = false }: { contentId: string; initial: boolean; compact?: boolean }) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const label = on ? "Retirer des favoris" : "Ajouter aux favoris";

  const toggle = () => {
    setError(null);
    startTransition(async () => {
      const r = await toggleFavoriteAction(contentId);
      if (r.error) setError(r.error);
      else setOn(r.favorite);
    });
  };

  const icon = <Heart aria-hidden className={`h-4 w-4 ${on ? "fill-current" : ""}`} strokeWidth={2.2} />;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={on}
        aria-label={compact ? label : undefined}
        title={compact ? label : undefined}
        className={
          compact
            ? `inline-flex h-8 w-8 items-center justify-center rounded border border-line bg-paper hover:border-primary disabled:opacity-60 ${on ? "text-primary" : "text-ink-2"}`
            : `inline-flex items-center gap-2 whitespace-nowrap rounded border-2 px-4 py-2 text-sm font-bold disabled:opacity-60 ${on ? "border-primary bg-primary-faint text-primary-dark hover:bg-primary-light" : "border-line text-ink hover:border-primary hover:text-primary"}`
        }
      >
        {icon}
        {!compact && (pending ? "…" : label)}
      </button>
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
    </span>
  );
}

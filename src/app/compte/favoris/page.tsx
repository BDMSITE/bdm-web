import type { Metadata } from "next";
import { EmptyState } from "@/components/site/content";

export const metadata: Metadata = { title: "Mes favoris" };

/* Favoris : fonction non encore disponible (aucun modèle en base). */

export default function FavorisPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Mes favoris</h1>
        <p className="mt-1 text-sm text-ink-2">Les contenus que vous mettrez de côté pour les retrouver plus tard.</p>
      </div>

      <EmptyState
        title="Fonction à venir"
        text="La mise en favoris des articles, offres, adresses et événements n'est pas encore disponible. Elle arrivera avec l'espace communauté."
        href="/magazine"
        cta="Parcourir le magazine"
      />
    </div>
  );
}

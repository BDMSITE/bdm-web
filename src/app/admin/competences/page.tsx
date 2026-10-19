import Link from "next/link";
import type { Metadata } from "next";
import { PageHead, Card, EmptyState } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Compétences" };

/* Compétences de la diaspora : aucun modèle « profil expert » ni « mise en relation »
   en base pour l'instant. État vide honnête + explication. */

export default function AdminCompetencesPage() {
  return (
    <>
      <PageHead
        title="Compétences de la diaspora"
        desc="Initiative HCBE : relier les expertises de la diaspora aux projets du Bénin (mentorat, missions courtes, conseil à distance)."
      >
        <Link
          href="/communaute/competences"
          className="whitespace-nowrap rounded border-2 border-primary px-4 py-1.5 text-sm font-bold text-primary hover:bg-primary hover:text-white"
        >
          Voir la page publique
        </Link>
      </PageHead>

      <div className="space-y-6">
        <Card title="Profils experts">
          <EmptyState title="Aucun profil expert en base.">
            Le schéma ne comporte pas encore de modèle « expert » (domaine, disponibilité, pièces justificatives, validation). La page publique présente le principe et invite les membres à compléter leur profil. La validation des experts arrivera quand ce modèle sera défini avec le HCBE.
          </EmptyState>
        </Card>
        <Card title="Mises en relation">
          <EmptyState title="Aucune mise en relation enregistrée.">
            Les demandes de mise en relation (institution → expert) passeront par le formulaire relais du site, sans jamais exposer d&apos;e-mail. Elles seront listées ici une fois le module en place.
          </EmptyState>
        </Card>
      </div>
    </>
  );
}

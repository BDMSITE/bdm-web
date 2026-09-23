import Link from "next/link";
import type { Metadata } from "next";
import {
  PageHead,
  StatCard,
  Card,
  Badge,
  TableShell,
  Th,
  Td,
  RowActions,
  FilterChips,
} from "@/components/admin/ui";

export const metadata: Metadata = { title: "Compétences" };

/* MAQUETTE — Module Compétences : validation des profils experts de la
   diaspora et suivi des mises en relation (relais). Données d'exemple. */

const CANDIDATURES = [
  { nom: "Dr Mariam A.", role: "Médecin de santé publique", pays: "Canada", domaine: "Santé", statut: "À valider", tone: "yellow" as const },
  { nom: "Boris E.", role: "Ingénieur énergie solaire", pays: "Allemagne", domaine: "Énergie", statut: "À valider", tone: "yellow" as const },
  { nom: "Carine T.", role: "Experte logistique portuaire", pays: "Pays-Bas", domaine: "Logistique", statut: "Pièces manquantes", tone: "red" as const },
  { nom: "Marcel K.", role: "Data scientist", pays: "France", domaine: "Informatique", statut: "À valider", tone: "yellow" as const },
];

const MISES_EN_RELATION = [
  { qui: "Ministère de la Santé → Dr Mariam A.", objet: "Mission d'appui vaccination (2 sem.)", quand: "hier", statut: "Acceptée", tone: "green" as const },
  { qui: "PME Fintech → Jean-Eudes K.", objet: "Mentorat équipe technique", quand: "il y a 3 j", statut: "En discussion", tone: "blue" as const },
  { qui: "Mairie de Ouidah → Nadège G.", objet: "Conseil juridique foncier", quand: "il y a 6 j", statut: "Sans réponse", tone: "gray" as const },
];

export default function AdminCompetencesPage() {
  return (
    <>
      <PageHead
        title="Compétences de la diaspora"
        desc="Valider les profils experts et suivre les mises en relation — initiative HCBE."
      >
        <Link
          href="/communaute/competences"
          className="whitespace-nowrap rounded border-2 border-primary px-4 py-1.5 text-sm font-bold text-primary hover:bg-primary hover:text-white"
        >
          Voir la page publique
        </Link>
      </PageHead>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Experts vérifiés" value="87" hint="23 pays" />
        <StatCard label="Profils à valider" value="4" tone="warn" hint="dont 1 avec pièces manquantes" />
        <StatCard label="Mises en relation (30 j)" value="12" hint="8 acceptées" />
        <StatCard label="Missions abouties" value="31" hint="depuis le lancement" />
      </div>

      <div className="mt-6 space-y-6">
        <Card
          title="Profils experts en attente"
          action={<FilterChips items={["Tous", "Santé", "Informatique", "Énergie", "Logistique"]} />}
        >
          <TableShell head={<><Th>Expert</Th><Th>Domaine</Th><Th>Pays</Th><Th>Statut</Th><Th>Actions</Th></>}>
            {CANDIDATURES.map((c) => (
              <tr key={c.nom} className="hover:bg-primary-faint">
                <Td className="font-semibold">
                  {c.nom}
                  <span className="block text-xs font-normal text-muted">{c.role}</span>
                </Td>
                <Td className="text-ink-2">{c.domaine}</Td>
                <Td className="whitespace-nowrap text-ink-2">{c.pays}</Td>
                <Td><Badge tone={c.tone}>{c.statut}</Badge></Td>
                <Td><RowActions items={["Valider", "Refuser", "Voir"]} /></Td>
              </tr>
            ))}
          </TableShell>
        </Card>

        <Card title="Dernières mises en relation (relais — e-mails jamais exposés)">
          <TableShell head={<><Th>Demande</Th><Th>Objet</Th><Th>Quand</Th><Th>Statut</Th></>}>
            {MISES_EN_RELATION.map((m) => (
              <tr key={m.qui} className="hover:bg-primary-faint">
                <Td className="font-semibold">{m.qui}</Td>
                <Td className="text-ink-2">{m.objet}</Td>
                <Td className="whitespace-nowrap text-muted">{m.quand}</Td>
                <Td><Badge tone={m.tone}>{m.statut}</Badge></Td>
              </tr>
            ))}
          </TableShell>
        </Card>
      </div>
    </>
  );
}

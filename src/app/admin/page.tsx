import Link from "next/link";
import type { Metadata } from "next";
import { PageHead, StatCard, Card, Badge, TableShell, Th, Td } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Tableau de bord" };

/* MAQUETTE — Tableau de bord admin : l'état du site en un coup d'œil. */

const A_TRAITER = [
  { n: 19, l: "contenus en modération", href: "/admin/moderation", tone: "warn" as const },
  { n: 1, l: "signalement urgent", href: "/admin/moderation", tone: "danger" as const },
  { n: 2, l: "comptes pro à valider", href: "/admin/communaute", tone: "warn" as const },
  { n: 3, l: "offres qui expirent sous 7 j", href: "/admin/emploi", tone: "default" as const },
];

const ACTIVITE = [
  { quoi: "Article membre soumis : « Mon premier Noël à Cotonou »", qui: "Élodie Z.", quand: "il y a 12 min", badge: "À modérer", tone: "yellow" as const },
  { quoi: "Nouvelle inscription entreprise : BTP Horizon", qui: "Abidjan", quand: "il y a 41 min", badge: "Compte pro", tone: "blue" as const },
  { quoi: "Profil expert soumis : Dr Mariam A. (Santé)", qui: "Montréal", quand: "il y a 55 min", badge: "Compétences", tone: "blue" as const },
  { quoi: "Offre validée : Comptable senior h/f", qui: "par Modératrice A.", quand: "il y a 1 h", badge: "Validé", tone: "green" as const },
  { quoi: "Signalement sur une petite annonce (rencontres)", qui: "Membre #1204", quand: "il y a 2 h", badge: "Urgent", tone: "red" as const },
  { quoi: "Newsletter de septembre programmée", qui: "par Rédaction", quand: "hier", badge: "Programmé", tone: "gray" as const },
];

export default function AdminDashboard() {
  return (
    <>
      <PageHead title="Tableau de bord" desc="Mardi 16 septembre 2026 — l'état du portail en un coup d'œil.">
        <Link href="/admin/moderation" className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
          Traiter la modération
        </Link>
      </PageHead>

      {/* À traiter */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {A_TRAITER.map((s) => (
          <Link key={s.l} href={s.href}>
            <StatCard label={s.l} value={String(s.n)} tone={s.tone} hint="Cliquer pour ouvrir" />
          </Link>
        ))}
      </div>

      {/* Chiffres du jour */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Visites aujourd'hui" value="1 082" hint="+12 % vs hier — Plausible" />
        <StatCard label="Nouveaux inscrits (7 j)" value="38" hint="dont 5 entreprises, 3 associations" />
        <StatCard label="Contenus publiés (7 j)" value="46" hint="12 par la rédaction, 34 par la communauté" />
        <StatCard label="Alertes envoyées ce matin" value="1 847" hint="taux d'ouverture 41 %" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Activité récente */}
        <Card title="Activité récente" action={<Link href="/admin/journal" className="whitespace-nowrap text-xs font-bold uppercase text-primary hover:underline">Tout le journal →</Link>}>
          <TableShell head={<><Th>Événement</Th><Th>Qui</Th><Th>Quand</Th><Th>Statut</Th></>}>
            {ACTIVITE.map((a) => (
              <tr key={a.quoi} className="hover:bg-primary-faint">
                <Td className="font-semibold">{a.quoi}</Td>
                <Td className="text-ink-2">{a.qui}</Td>
                <Td className="whitespace-nowrap text-muted">{a.quand}</Td>
                <Td><Badge tone={a.tone}>{a.badge}</Badge></Td>
              </tr>
            ))}
          </TableShell>
        </Card>

        {/* Raccourcis */}
        <div className="space-y-4">
          <Card title="Raccourcis">
            <div className="grid gap-2 p-4">
              {[
                { l: "Écrire un article", href: "/admin/redaction" },
                { l: "Composer la newsletter", href: "/admin/newsletter" },
                { l: "Ajouter une bannière pub", href: "/admin/regie" },
                { l: "Épingler un message En direct", href: "/admin/direct" },
                { l: "Valider les profils experts", href: "/admin/competences" },
                { l: "Importer des associations (CSV)", href: "/admin/communaute" },
              ].map((r) => (
                <Link key={r.l} href={r.href} className="rounded border border-line px-3 py-2 text-sm font-semibold text-ink-2 hover:border-primary hover:text-primary">
                  {r.l} →
                </Link>
              ))}
            </div>
          </Card>
          <Card title="Objectifs de lancement (CDC §13)">
            <ul className="space-y-2.5 p-4 text-sm">
              {[
                { l: "Articles rédaction", v: "12 / 40" },
                { l: "Béninois qui comptent", v: "8 / 50" },
                { l: "Associations pré-créées", v: "23 / 150" },
                { l: "Bonnes adresses", v: "31 / 200" },
                { l: "Offres réelles", v: "7 / 50" },
              ].map((o) => (
                <li key={o.l} className="flex items-center justify-between gap-3">
                  <span className="text-ink-2">{o.l}</span>
                  <span className="font-bold tabular-nums">{o.v}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

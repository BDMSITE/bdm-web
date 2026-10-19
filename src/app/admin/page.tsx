import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  PageHead,
  StatCard,
  Card,
  Badge,
  TableShell,
  Th,
  Td,
  EmptyState,
  fmtDateTime,
  fmtNumber,
  AUDIT_ACTION_LABEL,
} from "@/components/admin/ui";

export const metadata: Metadata = { title: "Tableau de bord" };

/* Tableau de bord admin : l'état réel du portail, calculé depuis la base. */

const JOUR = 864e5;

export default async function AdminDashboard() {
  const now = new Date();
  const il7j = new Date(now.getTime() - 7 * JOUR);
  const dans7j = new Date(now.getTime() + 7 * JOUR);

  const [
    enModeration,
    signalements,
    comptesProAConfirmer,
    offresExpirant,
    membresActifs,
    inscrits7j,
    publies7j,
    abonnes,
    activite,
  ] = await Promise.all([
    db.content.count({ where: { status: "IN_MODERATION" } }),
    db.report.count({ where: { status: "open" } }),
    db.user.count({ where: { status: "PENDING_EMAIL", accountType: { not: "MEMBER" }, importedFrom: null } }),
    db.content.count({
      where: { type: { in: ["JOB", "INTERNSHIP"] }, status: "PUBLISHED", expiresAt: { gte: now, lte: dans7j } },
    }),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { createdAt: { gte: il7j }, importedFrom: null } }),
    db.content.count({ where: { status: "PUBLISHED", publishedAt: { gte: il7j } } }),
    db.subscriber.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const aTraiter = [
    { n: enModeration, l: "contenus en modération", href: "/admin/moderation", tone: enModeration ? ("warn" as const) : ("default" as const) },
    { n: signalements, l: "signalements ouverts", href: "/admin/moderation", tone: signalements ? ("danger" as const) : ("default" as const) },
    { n: comptesProAConfirmer, l: "comptes pro inscrits, e-mail non confirmé", href: "/admin/communaute", tone: "default" as const },
    { n: offresExpirant, l: "offres qui expirent sous 7 jours", href: "/admin/emploi", tone: "default" as const },
  ];

  const dateDuJour = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <PageHead title="Tableau de bord" desc={`${dateDuJour.charAt(0).toUpperCase()}${dateDuJour.slice(1)} — l'état du portail, calculé depuis la base.`}>
        <Link href="/admin/moderation" className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
          Ouvrir la modération
        </Link>
      </PageHead>

      {/* À traiter */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {aTraiter.map((s) => (
          <Link key={s.l} href={s.href}>
            <StatCard label={s.l} value={fmtNumber(s.n)} tone={s.tone} hint="Cliquer pour ouvrir" />
          </Link>
        ))}
      </div>

      {/* Chiffres réels */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Membres actifs" value={fmtNumber(membresActifs)} hint="comptes dont l'e-mail est confirmé" />
        <StatCard label="Nouveaux inscrits (7 j)" value={fmtNumber(inscrits7j)} hint="hors comptes importés" />
        <StatCard label="Contenus publiés (7 j)" value={fmtNumber(publies7j)} hint="tous types confondus" />
        <StatCard label="Abonnés newsletter" value={fmtNumber(abonnes)} hint="envoi via Brevo à venir" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Activité récente = journal d'audit */}
        <Card title="Activité récente" action={<Link href="/admin/journal" className="whitespace-nowrap text-xs font-bold uppercase text-primary hover:underline">Tout le journal</Link>}>
          {activite.length === 0 ? (
            <EmptyState title="Aucune action enregistrée pour l'instant.">
              Les validations, refus, publications et suspensions faits depuis ce back-office apparaîtront ici.
            </EmptyState>
          ) : (
            <TableShell head={<><Th>Action</Th><Th>Détail</Th><Th>Qui</Th><Th>Quand</Th></>}>
              {activite.map((a) => {
                const meta = (a.meta ?? {}) as Record<string, unknown>;
                const detail = typeof meta.title === "string" ? meta.title : typeof meta.name === "string" ? meta.name : a.entityId ?? "—";
                return (
                  <tr key={a.id} className="hover:bg-primary-faint">
                    <Td><Badge tone="gray">{AUDIT_ACTION_LABEL[a.action] ?? a.action}</Badge></Td>
                    <Td className="font-semibold">{detail}</Td>
                    <Td className="text-ink-2">{a.user?.name ?? a.user?.email ?? "—"}</Td>
                    <Td className="whitespace-nowrap text-muted">{fmtDateTime(a.createdAt)}</Td>
                  </tr>
                );
              })}
            </TableShell>
          )}
        </Card>

        {/* Raccourcis */}
        <div className="space-y-4">
          <Card title="Raccourcis">
            <div className="grid gap-2 p-4">
              {[
                { l: "Écrire un article", href: "/admin/redaction" },
                { l: "Offres d'emploi et stages", href: "/admin/emploi" },
                { l: "Comptes de la communauté", href: "/admin/communaute" },
                { l: "Inviter les membres importés", href: "/admin/imports" },
                { l: "Mots-clés", href: "/admin/mots-cles" },
                { l: "Statistiques", href: "/admin/statistiques" },
              ].map((r) => (
                <Link key={r.l} href={r.href} className="rounded border border-line px-3 py-2 text-sm font-semibold text-ink-2 hover:border-primary hover:text-primary">
                  {r.l}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

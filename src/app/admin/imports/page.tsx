import type { Metadata } from "next";
import { PageHead, StatCard, Card, Badge, TableShell, Th, Td } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { InviteForm } from "./invite-form";

export const metadata: Metadata = { title: "Imports de membres" };

/* Suivi des comptes importés (base Excel HCBE) et envoi des invitations par lots.
   L'import lui-même se fait par script : pnpm import:membres <fichier> --go */

export default async function AdminImportsPage() {
  const [total, actives, invites, aInviter, derniers] = await Promise.all([
    db.user.count({ where: { importedFrom: { not: null } } }),
    db.user.count({ where: { importedFrom: { not: null }, status: "ACTIVE" } }),
    db.user.count({ where: { importedFrom: { not: null }, status: "PENDING_EMAIL", invitedAt: { not: null } } }),
    db.user.count({ where: { importedFrom: { not: null }, status: "PENDING_EMAIL", invitedAt: null } }),
    db.user.findMany({
      where: { importedFrom: { not: null } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      select: { id: true, email: true, status: true, invitedAt: true, importedFrom: true, profile: { select: { displayName: true, city: true, country: true } } },
    }),
  ]);
  const fmt = (d: Date | null) => (d ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—");

  return (
    <>
      <PageHead
        title="Imports de membres"
        desc="Comptes créés depuis la base Excel du HCBE. Chaque membre reçoit un e-mail d'invitation ; au clic, son compte s'active et il reprend la main sur son espace."
      >
        <InviteForm aInviter={aInviter} />
      </PageHead>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Comptes importés" value={String(total)} />
        <StatCard label="Activés" value={String(actives)} hint={total ? `${Math.round((actives / total) * 100)} % des importés` : undefined} />
        <StatCard label="Invités, en attente" value={String(invites)} hint="relance automatique après 7 jours" />
        <StatCard label="À inviter" value={String(aInviter)} tone={aInviter ? "warn" : "default"} />
      </div>

      <div className="mt-6">
        <Card title="Derniers comptes importés">
          {derniers.length === 0 ? (
            <p className="p-4 text-sm text-muted">
              Aucun import pour l&apos;instant. Lancer <code className="rounded bg-paper-2 px-1">pnpm import:membres fichier.xlsx</code> (simulation), puis avec <code className="rounded bg-paper-2 px-1">--go</code>.
            </p>
          ) : (
            <TableShell head={<><Th>Membre</Th><Th>E-mail</Th><Th>Lieu</Th><Th>Source</Th><Th>Invité le</Th><Th>Statut</Th></>}>
              {derniers.map((u) => (
                <tr key={u.id} className="hover:bg-primary-faint">
                  <Td className="font-semibold">{u.profile?.displayName ?? "—"}</Td>
                  <Td className="text-ink-2">{u.email}</Td>
                  <Td className="whitespace-nowrap text-ink-2">{[u.profile?.city, u.profile?.country].filter(Boolean).join(" · ") || "—"}</Td>
                  <Td className="whitespace-nowrap text-muted">{u.importedFrom}</Td>
                  <Td className="whitespace-nowrap text-muted">{fmt(u.invitedAt)}</Td>
                  <Td>
                    {u.status === "ACTIVE" ? <Badge tone="green">Activé</Badge> : u.invitedAt ? <Badge tone="yellow">Invité</Badge> : <Badge tone="gray">À inviter</Badge>}
                  </Td>
                </tr>
              ))}
            </TableShell>
          )}
        </Card>
      </div>
    </>
  );
}

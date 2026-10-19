import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHead, Card, Badge, TableShell, Th, Td, EmptyState, fmtDateTime, fmtNumber, AUDIT_ACTION_LABEL } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Journal d'activité" };

/* Journal d'audit : qui a fait quoi, quand (AuditLog), 50 par page. */

const PAR_PAGE = 50;

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminJournalPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const [total, logs] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAR_PAGE,
      take: PAR_PAGE,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAR_PAGE));

  return (
    <>
      <PageHead title="Journal d'activité" desc={`${fmtNumber(total)} action${total > 1 ? "s" : ""} enregistrée${total > 1 ? "s" : ""} depuis le back-office.`} />

      <Card title={`Page ${page} sur ${pages}`}>
        {logs.length === 0 ? (
          <EmptyState title="Aucune action enregistrée.">
            Chaque validation, refus, publication, archivage, suspension ou ajout de mot-clé fait depuis le back-office est consigné ici.
          </EmptyState>
        ) : (
          <TableShell head={<><Th>Quand</Th><Th>Action</Th><Th>Entité</Th><Th>Détail</Th><Th>Par</Th></>}>
            {logs.map((l) => {
              const meta = (l.meta ?? {}) as Record<string, unknown>;
              const detail = typeof meta.title === "string" ? meta.title : typeof meta.name === "string" ? meta.name : l.entityId ?? "—";
              return (
                <tr key={l.id} className="hover:bg-primary-faint">
                  <Td className="whitespace-nowrap text-muted">{fmtDateTime(l.createdAt)}</Td>
                  <Td><Badge tone="gray">{AUDIT_ACTION_LABEL[l.action] ?? l.action}</Badge></Td>
                  <Td className="text-ink-2">{l.entity}</Td>
                  <Td className="max-w-[360px] truncate font-semibold">{detail}</Td>
                  <Td className="text-ink-2">{l.user?.name ?? l.user?.email ?? "Système"}</Td>
                </tr>
              );
            })}
          </TableShell>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-sm">
            {page > 1 ? (
              <Link href={`/admin/journal?page=${page - 1}`} className="font-bold text-primary hover:underline">Plus récent</Link>
            ) : (
              <span />
            )}
            {page < pages ? (
              <Link href={`/admin/journal?page=${page + 1}`} className="font-bold text-primary hover:underline">Plus ancien</Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </Card>
    </>
  );
}

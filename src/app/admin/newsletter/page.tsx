import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHead, StatCard, Card, Badge, TableShell, Th, Td, EmptyState, fmtDate, fmtDateTime, fmtNumber } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Newsletter & alertes" };

/* Newsletter : abonnés (total, par segment, 50 derniers) et numéros. Pas d'envoi : Brevo à brancher. */

export default async function AdminNewsletterPage() {
  const [total, confirmes, segmentsBruts, derniers, numeros] = await Promise.all([
    db.subscriber.count(),
    db.subscriber.count({ where: { confirmedAt: { not: null } } }),
    db.subscriber.findMany({ select: { segments: true } }),
    db.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, email: true, confirmedAt: true, segments: true, createdAt: true },
    }),
    db.newsletterIssue.findMany({ orderBy: { sentAt: "desc" }, take: 50, select: { id: true, subject: true, sentAt: true, contentIds: true } }),
  ]);

  const parSegment = new Map<string, number>();
  let sansSegment = 0;
  for (const s of segmentsBruts) {
    const segs = Array.isArray(s.segments) ? (s.segments as unknown[]).filter((x): x is string => typeof x === "string") : [];
    if (segs.length === 0) sansSegment++;
    for (const seg of segs) parSegment.set(seg, (parSegment.get(seg) ?? 0) + 1);
  }
  const segments = [...parSegment.entries()].sort((a, b) => b[1] - a[1]);
  const segs = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === "string") : []);

  return (
    <>
      <PageHead title="Newsletter & alertes" desc="Abonnés à la lettre d'information et numéros envoyés." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Abonnés" value={fmtNumber(total)} />
        <StatCard label="Adresses confirmées" value={fmtNumber(confirmes)} hint="double opt-in" />
        {segments.slice(0, 2).map(([seg, n]) => (
          <StatCard key={seg} label={`Segment « ${seg} »`} value={fmtNumber(n)} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card title="Par segment">
          {segments.length === 0 ? (
            <EmptyState title="Aucun segment." />
          ) : (
            <ul className="divide-y divide-line text-sm">
              {segments.map(([seg, n]) => (
                <li key={seg} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="font-semibold">{seg}</span>
                  <span className="tabular-nums text-ink-2">{fmtNumber(n)}</span>
                </li>
              ))}
              {sansSegment > 0 && (
                <li className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-ink-2">Sans segment</span>
                  <span className="tabular-nums text-ink-2">{fmtNumber(sansSegment)}</span>
                </li>
              )}
            </ul>
          )}
        </Card>

        <Card title="50 derniers abonnés">
          {derniers.length === 0 ? (
            <EmptyState title="Aucun abonné pour l'instant." />
          ) : (
            <TableShell head={<><Th>E-mail</Th><Th>Segments</Th><Th>Inscrit le</Th><Th>Confirmé</Th></>}>
              {derniers.map((s) => (
                <tr key={s.id} className="hover:bg-primary-faint">
                  <Td className="font-semibold">{s.email}</Td>
                  <Td className="text-ink-2">{segs(s.segments).join(", ") || "—"}</Td>
                  <Td className="whitespace-nowrap text-muted">{fmtDate(s.createdAt)}</Td>
                  <Td>{s.confirmedAt ? <Badge tone="green">Confirmé</Badge> : <Badge tone="gray">Non confirmé</Badge>}</Td>
                </tr>
              ))}
            </TableShell>
          )}
        </Card>
      </div>

      <Card className="mt-6" title={`Numéros (${numeros.length})`}>
        {numeros.length === 0 ? (
          <EmptyState title="Aucun numéro composé pour l'instant.">
            La composition et l&apos;envoi de la newsletter passeront par Brevo (gratuit, 300 e-mails/jour) — envoi via Brevo à venir.
          </EmptyState>
        ) : (
          <TableShell head={<><Th>Objet</Th><Th>Contenus</Th><Th>Envoyé le</Th></>}>
            {numeros.map((n) => (
              <tr key={n.id} className="hover:bg-primary-faint">
                <Td className="font-semibold">{n.subject}</Td>
                <Td className="tabular-nums text-ink-2">{Array.isArray(n.contentIds) ? n.contentIds.length : 0}</Td>
                <Td className="whitespace-nowrap text-muted">{n.sentAt ? fmtDateTime(n.sentAt) : "Non envoyé"}</Td>
              </tr>
            ))}
          </TableShell>
        )}
      </Card>
    </>
  );
}

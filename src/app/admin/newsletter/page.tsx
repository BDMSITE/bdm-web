import type { Metadata } from "next";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendNewsletterAction } from "@/lib/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { countRecipients, issueStats } from "@/lib/newsletter";
import { CONTENT_LABEL } from "@/lib/routes";
import { PageHead, StatCard, Card, Badge, TableShell, Th, Td, EmptyState, fmtDate, fmtDateTime, fmtNumber } from "@/components/admin/ui";
import { ComposeForm } from "./compose-form";

export const metadata: Metadata = { title: "Newsletter & alertes" };

/* Newsletter : abonnés (total, par segment, 50 derniers), composition d'un numéro à partir des
   contenus publiés, envoi par lots via Brevo (limite journalière réglable dans Paramètres),
   reprise automatique par le cron du matin. */

export default async function AdminNewsletterPage() {
  const [session, destinataires, recents, total, confirmes, segmentsBruts, derniers, numeros] = await Promise.all([
    auth(),
    countRecipients(),
    db.content.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 40, select: { id: true, title: true, type: true, publishedAt: true } }),
    db.subscriber.count(),
    db.subscriber.count({ where: { confirmedAt: { not: null } } }),
    db.subscriber.findMany({ select: { segments: true } }),
    db.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, email: true, confirmedAt: true, segments: true, createdAt: true },
    }),
    db.newsletterIssue.findMany({ orderBy: [{ sentAt: { sort: "desc", nulls: "first" } }], take: 50, select: { id: true, subject: true, sentAt: true, contentIds: true, stats: true } }),
  ]);

  const parSegment = new Map<string, number>();
  let sansSegment = 0;
  for (const s of segmentsBruts) {
    const segs = Array.isArray(s.segments) ? (s.segments as unknown[]).filter((x): x is string => typeof x === "string") : [];
    if (segs.length === 0) sansSegment++;
    for (const seg of segs) parSegment.set(seg, (parSegment.get(seg) ?? 0) + 1);
  }
  const segments = [...parSegment.entries()].sort((a, b) => b[1] - a[1]);
  const isAdmin = session?.user?.role === "ADMIN";
  const segs = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === "string") : []);

  return (
    <>
      <PageHead title="Newsletter & alertes" desc="Abonnés à la lettre d'information et numéros envoyés." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Abonnés" value={fmtNumber(total)} />
        <StatCard label="Adresses confirmées" value={fmtNumber(confirmes)} hint="double opt-in" />
        <StatCard label="Destinataires" value={fmtNumber(destinataires)} hint="confirmés + membres actifs" />
        {segments.slice(0, 1).map(([seg, n]) => (
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

      <Card className="mt-6" title="Composer un numéro">
        <ComposeForm contents={recents.map((c) => ({ id: c.id, title: c.title, label: CONTENT_LABEL[c.type], date: c.publishedAt ? fmtDate(c.publishedAt) : "" }))} />
      </Card>

      <Card className="mt-6" title={`Numéros (${numeros.length})`}>
        {numeros.length === 0 ? (
          <EmptyState title="Aucun numéro composé pour l'instant.">Composez le premier ci-dessus : objet, mot d&apos;introduction, contenus à inclure.</EmptyState>
        ) : (
          <TableShell head={<><Th>Objet</Th><Th>Contenus</Th><Th>Envoi</Th><Th>Démarré le</Th>{isAdmin && <Th>Action</Th>}</>}>
            {numeros.map((n) => {
              const s = issueStats(n.stats);
              return (
                <tr key={n.id} className="hover:bg-primary-faint">
                  <Td className="font-semibold">{n.subject}</Td>
                  <Td className="tabular-nums text-ink-2">{Array.isArray(n.contentIds) ? n.contentIds.length : 0}</Td>
                  <Td>
                    {s.done ? <Badge tone="green">Terminé · {fmtNumber(s.sent)} envoyés</Badge> : n.sentAt ? <Badge tone="yellow">En cours · {fmtNumber(s.sent)}{s.total ? ` / ${fmtNumber(s.total)}` : ""}</Badge> : <Badge tone="gray">Non envoyé</Badge>}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{n.sentAt ? fmtDateTime(n.sentAt) : "—"}</Td>
                  {isAdmin && (
                    <Td>
                      {!s.done && (
                        <ActionButton
                          action={sendNewsletterAction}
                          fields={{ id: n.id }}
                          label={n.sentAt ? "Continuer l'envoi" : "Envoyer maintenant"}
                          tone="primary"
                          confirm={n.sentAt ? undefined : `Envoyer « ${n.subject} » à ${fmtNumber(destinataires)} destinataire${destinataires > 1 ? "s" : ""} ?`}
                        />
                      )}
                    </Td>
                  )}
                </tr>
              );
            })}
          </TableShell>
        )}
      </Card>
    </>
  );
}

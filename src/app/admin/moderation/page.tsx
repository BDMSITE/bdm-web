import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { contentHref } from "@/lib/routes";
import { moderateContentAction, resolveReportAction } from "@/lib/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { RejectForm } from "./reject-form";
import { PageHead, Card, Badge, TableShell, Th, Td, EmptyState, TypeBadge, EditLink, fmtDateTime } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Modération" };

/* Modération : contenus en attente (IN_MODERATION) + signalements ouverts.
   Valider = PUBLISHED (publishedAt = maintenant, indexation), Refuser = REJECTED.
   Signalement : Clôturer (sans suite) ou Retirer le contenu (ARCHIVED + clôture). */

export default async function ModerationPage() {
  const [enAttente, signalements] = await Promise.all([
    db.content.findMany({
      where: { status: "IN_MODERATION" },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: {
        id: true,
        type: true,
        title: true,
        slug: true,
        excerpt: true,
        city: true,
        country: true,
        createdAt: true,
        ownerProfile: { select: { displayName: true, slug: true } },
      },
    }),
    db.report.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: {
        id: true,
        reason: true,
        createdAt: true,
        content: { select: { id: true, title: true, type: true, slug: true } },
        reporter: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHead
        title="Modération"
        desc="Les contenus déposés par les membres passent ici avant publication. Plus ancien d'abord."
      />

      <div className="space-y-6">
        <Card title={`En attente (${enAttente.length})`}>
          {enAttente.length === 0 ? (
            <EmptyState title="Rien à modérer.">
              Les contenus déposés par les membres (articles, offres, annonces, événements, adresses) apparaîtront ici dès leur soumission.
            </EmptyState>
          ) : (
            <TableShell head={<><Th>Contenu</Th><Th>Type</Th><Th>Auteur</Th><Th>Soumis le</Th><Th>&nbsp;</Th></>}>
              {enAttente.map((c) => (
                <tr key={c.id} className="hover:bg-primary-faint">
                  <Td className="max-w-[360px]">
                    <p className="truncate font-semibold">{c.title}</p>
                    {c.excerpt && <p className="truncate text-xs text-muted">{c.excerpt}</p>}
                    <p className="text-xs text-muted">{[c.city, c.country].filter(Boolean).join(", ") || "Lieu non renseigné"}</p>
                  </Td>
                  <Td><TypeBadge type={c.type} /></Td>
                  <Td className="text-ink-2">
                    {c.ownerProfile ? (
                      <Link href={`/communaute/membres/${c.ownerProfile.slug}`} className="hover:text-primary hover:underline">{c.ownerProfile.displayName}</Link>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{fmtDateTime(c.createdAt)}</Td>
                  <Td>
                    <div className="flex flex-nowrap justify-end gap-2">
                      <EditLink id={c.id} />
                      <ActionButton action={moderateContentAction} fields={{ id: c.id, decision: "publish" }} label="Valider" tone="primary" />
                      <RejectForm id={c.id} title={c.title} />
                    </div>
                  </Td>
                </tr>
              ))}
            </TableShell>
          )}
        </Card>

        <Card title={`Signalements ouverts (${signalements.length})`}>
          {signalements.length === 0 ? (
            <EmptyState title="Aucun signalement ouvert.">
              Les signalements envoyés par les membres depuis une fiche apparaîtront ici.
            </EmptyState>
          ) : (
            <TableShell head={<><Th>Contenu signalé</Th><Th>Motif</Th><Th>Par</Th><Th>Quand</Th><Th>&nbsp;</Th></>}>
              {signalements.map((r) => (
                <tr key={r.id} className="hover:bg-primary-faint">
                  <Td className="font-semibold">
                    {r.content ? (
                      <Link href={contentHref(r.content.type, r.content.slug)} className="hover:text-primary hover:underline">{r.content.title}</Link>
                    ) : (
                      <Badge tone="gray">Contenu supprimé</Badge>
                    )}
                  </Td>
                  <Td className="max-w-[360px] text-ink-2">{r.reason}</Td>
                  <Td className="text-ink-2">{r.reporter.name ?? r.reporter.email}</Td>
                  <Td className="whitespace-nowrap text-muted">{fmtDateTime(r.createdAt)}</Td>
                  <Td>
                    <div className="flex flex-nowrap justify-end gap-2">
                      {r.content && <EditLink id={r.content.id} />}
                      <ActionButton action={resolveReportAction} fields={{ id: r.id, decision: "close" }} label="Clôturer" confirm="Clôturer ce signalement sans suite ?" />
                      {r.content && (
                        <ActionButton
                          action={resolveReportAction}
                          fields={{ id: r.id, decision: "remove" }}
                          label="Retirer le contenu"
                          tone="danger"
                          confirm={`Retirer « ${r.content.title} » du site (archivage) et clôturer le signalement ?`}
                        />
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </TableShell>
          )}
          <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
            Clôturer = signalement classé sans suite, le contenu reste en ligne. Retirer = le contenu passe en statut Archivé (récupérable via Modifier) et tous ses signalements ouverts sont clôturés.
          </p>
        </Card>
      </div>
    </>
  );
}

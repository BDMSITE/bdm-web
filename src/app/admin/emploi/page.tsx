import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { contentHref } from "@/lib/routes";
import { setContentStatusAction } from "@/lib/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { PageHead, StatCard, Card, TableShell, Th, Td, EmptyState, TypeBadge, ContentStatusBadge, EditLink, fmtDate, fmtNumber } from "@/components/admin/ui";
import { JobOfferPanel } from "./form";

export const metadata: Metadata = { title: "Emploi" };

/* Emploi : offres et stages (tous statuts) avec contrat, statut, expiration. Publier / Archiver. */

const JOUR = 864e5;

export default async function AdminEmploiPage() {
  const now = new Date();
  const dans7j = new Date(now.getTime() + 7 * JOUR);
  const TYPES = ["JOB", "INTERNSHIP"] as const;

  const [offres, enLigne, enModeration, expirant] = await Promise.all([
    db.content.findMany({
      where: { type: { in: [...TYPES] } },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        title: true,
        slug: true,
        status: true,
        city: true,
        country: true,
        publishedAt: true,
        expiresAt: true,
        job: { select: { contractType: true } },
        ownerProfile: { select: { displayName: true } },
      },
    }),
    db.content.count({ where: { type: { in: [...TYPES] }, status: "PUBLISHED" } }),
    db.content.count({ where: { type: { in: [...TYPES] }, status: "IN_MODERATION" } }),
    db.content.count({ where: { type: { in: [...TYPES] }, status: "PUBLISHED", expiresAt: { gte: now, lte: dans7j } } }),
  ]);

  return (
    <>
      <PageHead title="Emploi & stages" desc="Toutes les offres déposées, quel que soit leur statut.">
        <JobOfferPanel />
      </PageHead>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Offres en ligne" value={fmtNumber(enLigne)} />
        <StatCard label="En modération" value={fmtNumber(enModeration)} tone={enModeration ? "warn" : "default"} hint="à traiter depuis la page Modération" />
        <StatCard label="Expirent sous 7 jours" value={fmtNumber(expirant)} />
      </div>

      <Card title={`Offres (${offres.length}${offres.length === 100 ? ", 100 plus récentes" : ""})`}>
        {offres.length === 0 ? (
          <EmptyState title="Aucune offre pour l'instant.">
            Les offres déposées par les entreprises et associations depuis « Publier » apparaîtront ici. L&apos;équipe peut aussi en créer avec « Nouvelle offre ».
          </EmptyState>
        ) : (
          <TableShell head={<><Th>Offre</Th><Th>Type</Th><Th>Contrat</Th><Th>Recruteur</Th><Th>Statut</Th><Th>Publiée</Th><Th>Expire</Th><Th>&nbsp;</Th></>}>
            {offres.map((o) => {
              const expireBientot = o.expiresAt && o.status === "PUBLISHED" && o.expiresAt >= now && o.expiresAt <= dans7j;
              const expiree = o.expiresAt && o.expiresAt < now;
              return (
                <tr key={o.id} className="hover:bg-primary-faint">
                  <Td className="max-w-[300px]">
                    <p className="truncate font-semibold">{o.title}</p>
                    <p className="text-xs text-muted">{[o.city, o.country].filter(Boolean).join(", ") || "Lieu non renseigné"}</p>
                  </Td>
                  <Td><TypeBadge type={o.type} /></Td>
                  <Td className="text-ink-2">{o.job?.contractType ?? "—"}</Td>
                  <Td className="text-ink-2">{o.ownerProfile?.displayName ?? "—"}</Td>
                  <Td><ContentStatusBadge status={o.status} /></Td>
                  <Td className="whitespace-nowrap text-muted">{fmtDate(o.publishedAt)}</Td>
                  <Td className={`whitespace-nowrap ${expireBientot ? "font-bold text-ink" : expiree ? "text-danger" : "text-muted"}`}>
                    {fmtDate(o.expiresAt)}
                  </Td>
                  <Td>
                    <div className="flex flex-nowrap justify-end gap-2">
                      <EditLink id={o.id} />
                      {o.status === "PUBLISHED" ? (
                        <Link href={contentHref(o.type, o.slug)} className="whitespace-nowrap rounded border border-line px-2.5 py-1 text-xs font-bold text-ink-2 hover:border-primary hover:text-primary">
                          Voir
                        </Link>
                      ) : o.status !== "IN_MODERATION" ? (
                        <ActionButton action={setContentStatusAction} fields={{ id: o.id, status: "PUBLISHED" }} label="Publier" tone="primary" />
                      ) : null}
                      {o.status !== "ARCHIVED" && o.status !== "IN_MODERATION" && (
                        <ActionButton action={setContentStatusAction} fields={{ id: o.id, status: "ARCHIVED" }} label="Archiver" confirm={`Archiver « ${o.title} » ?`} />
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </TableShell>
        )}
      </Card>
    </>
  );
}

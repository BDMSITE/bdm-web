import Link from "next/link";
import { db } from "@/lib/db";
import { setHostingStatusAction } from "@/lib/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { HOSTING_KIND_LABEL, HOSTING_AUDIENCE_LABEL, hostingAudience } from "@/lib/competences";
import { Card, Badge, TableShell, Th, Td, EmptyState, ContentStatusBadge, fmtDate } from "@/components/admin/ui";

/* Accueil & hébergement : fiches des membres, relecture (publier / refuser / archiver). */

export async function AccueilAdminCard() {
  const fiches = await db.hostingOffer.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 100,
    include: { profile: { select: { slug: true, displayName: true } } },
  });
  const aRelire = fiches.filter((f) => f.status === "IN_MODERATION").length;
  return (
    <Card title={`Accueil & hébergement (${fiches.length}${aRelire ? ` · ${aRelire} à relire` : ""})`}>
      {fiches.length === 0 ? (
        <EmptyState title="Aucune fiche d'accueil pour l'instant.">Les membres proposent un accueil depuis leur espace (Ma fiche d&apos;accueil).</EmptyState>
      ) : (
        <TableShell head={<><Th>Hôte</Th><Th>Accueil</Th><Th>Public</Th><Th>Lieu</Th><Th>Conditions</Th><Th>État</Th><Th>Actions</Th></>}>
          {fiches.map((f) => (
            <tr key={f.id} className="hover:bg-primary-faint align-top">
              <Td className="font-semibold"><Link href={`/communaute/membres/${f.profile.slug}`} className="hover:underline">{f.profile.displayName}</Link><br /><span className="text-xs font-normal text-muted">{fmtDate(f.updatedAt)}</span></Td>
              <Td>{HOSTING_KIND_LABEL[f.kind]}{f.capacity ? ` · ${f.capacity} pers.` : ""}{f.duration ? <><br /><span className="text-xs text-muted">{f.duration}</span></> : null}</Td>
              <Td>{hostingAudience(f.audience).map((a) => <Badge key={a} tone="gray">{HOSTING_AUDIENCE_LABEL[a]}</Badge>)}</Td>
              <Td className="text-ink-2">{f.city}, {f.country}</Td>
              <Td className="max-w-xs whitespace-pre-line text-xs text-ink-2">{f.conditions}</Td>
              <Td><ContentStatusBadge status={f.status} /></Td>
              <Td>
                <div className="flex flex-wrap gap-1.5">
                  {f.status !== "PUBLISHED" && <ActionButton action={setHostingStatusAction} fields={{ id: f.id, decision: "publish" }} label="Publier" tone="primary" />}
                  {f.status === "IN_MODERATION" && <ActionButton action={setHostingStatusAction} fields={{ id: f.id, decision: "reject" }} label="Refuser" tone="danger" />}
                  {f.status === "PUBLISHED" && <ActionButton action={setHostingStatusAction} fields={{ id: f.id, decision: "archive" }} label="Retirer" tone="neutral" />}
                </div>
              </Td>
            </tr>
          ))}
        </TableShell>
      )}
    </Card>
  );
}

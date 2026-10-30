import Link from "next/link";
import type { Metadata } from "next";
import type { ContentType } from "@prisma/client";
import { db } from "@/lib/db";
import { contentHref } from "@/lib/routes";
import { setContentStatusAction } from "@/lib/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { PageHead, Card, TableShell, Th, Td, EmptyState, ContentStatusBadge, EditLink, fmtDate } from "@/components/admin/ui";
import { ServiceContentPanel } from "./form";
import { AccueilAdminCard } from "./accueil";

export const metadata: Metadata = { title: "Services" };

/* Services : adresses, événements, bons plans, annonces, mises en relation — listes par
   rubrique avec statut, création par l'équipe, Modifier / Archiver. */

const RUBRIQUES: { type: ContentType; titre: string; vide: string }[] = [
  { type: "PLACE", titre: "Bonnes adresses", vide: "Aucune adresse déposée pour l'instant." },
  { type: "EVENT", titre: "Agenda (événements)", vide: "Aucun événement déposé pour l'instant." },
  { type: "DEAL", titre: "Bons plans membres", vide: "Aucun bon plan enregistré pour l'instant." },
  { type: "CLASSIFIED", titre: "Petites annonces", vide: "Aucune annonce déposée pour l'instant." },
  { type: "HELP_REQUEST", titre: "Chercher / trouver (mises en relation)", vide: "Aucune demande de mise en relation pour l'instant." },
];

export default async function AdminServicesPage() {
  const listes = await Promise.all(
    RUBRIQUES.map((r) =>
      db.content.findMany({
        where: { type: r.type },
        orderBy: { updatedAt: "desc" },
        take: 30,
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
          place: { select: { category: true } },
          event: { select: { startsAt: true, category: true } },
          classified: { select: { category: true } },
          deal: { select: { validTo: true } },
          ownerProfile: { select: { displayName: true } },
        },
      }),
    ),
  );

  return (
    <>
      <PageHead title="Services" desc="Adresses, agenda, bons plans, petites annonces et mises en relation : 30 derniers contenus par rubrique, tous statuts.">
        <ServiceContentPanel />
      </PageHead>

      <div className="space-y-6">
        {RUBRIQUES.map((r, i) => {
          const rows = listes[i];
          return (
            <Card key={r.type} title={`${r.titre} (${rows.length})`} action={<Link href={contentHref(r.type)} className="whitespace-nowrap text-xs font-bold uppercase text-primary hover:underline">Page publique</Link>}>
              {rows.length === 0 ? (
                <EmptyState title={r.vide} />
              ) : (
                <TableShell head={<><Th>Titre</Th><Th>Catégorie / date</Th><Th>Lieu</Th><Th>Auteur</Th><Th>Statut</Th><Th>Publié</Th><Th>&nbsp;</Th></>}>
                  {rows.map((c) => {
                    const detail =
                      c.type === "EVENT"
                        ? [c.event?.category, c.event ? fmtDate(c.event.startsAt) : null].filter(Boolean).join(" · ")
                        : c.type === "DEAL"
                          ? c.deal?.validTo ? `valable jusqu'au ${fmtDate(c.deal.validTo)}` : "—"
                          : c.place?.category ?? c.classified?.category ?? "—";
                    return (
                      <tr key={c.id} className="hover:bg-primary-faint">
                        <Td className="max-w-[300px] truncate font-semibold">{c.title}</Td>
                        <Td className="text-ink-2">{detail || "—"}</Td>
                        <Td className="whitespace-nowrap text-ink-2">{[c.city, c.country].filter(Boolean).join(", ") || "—"}</Td>
                        <Td className="text-ink-2">{c.ownerProfile?.displayName ?? "—"}</Td>
                        <Td><ContentStatusBadge status={c.status} /></Td>
                        <Td className="whitespace-nowrap text-muted">{fmtDate(c.publishedAt)}</Td>
                        <Td>
                          <div className="flex flex-nowrap justify-end gap-2">
                            <EditLink id={c.id} />
                            {c.status === "PUBLISHED" && (
                              <Link href={contentHref(c.type, c.slug)} className="whitespace-nowrap rounded border border-line px-2.5 py-1 text-xs font-bold text-ink-2 hover:border-primary hover:text-primary">
                                Voir
                              </Link>
                            )}
                            {c.status !== "ARCHIVED" && c.status !== "IN_MODERATION" && (
                              <ActionButton action={setContentStatusAction} fields={{ id: c.id, status: "ARCHIVED" }} label="Archiver" confirm={`Archiver « ${c.title} » ?`} />
                            )}
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </TableShell>
              )}
            </Card>
          );
        })}
        <AccueilAdminCard />
      </div>
    </>
  );
}

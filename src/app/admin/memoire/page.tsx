import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { contentHref } from "@/lib/routes";
import { setContentStatusAction } from "@/lib/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { PageHead, Card, TableShell, Th, Td, EmptyState, ContentStatusBadge, EditLink, fmtDate } from "@/components/admin/ui";
import { MemoryPlacePanel, CelebrityForm } from "./form";

export const metadata: Metadata = { title: "Mémoire & HCBE" };

/* Mémoire : lieux de mémoire (MEMORY_PLACE) et fiches « Béninois qui comptent » (Celebrity). */

export default async function AdminMemoirePage() {
  const [lieux, celebrites] = await Promise.all([
    db.content.findMany({
      where: { type: "MEMORY_PLACE" },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, type: true, title: true, slug: true, status: true, city: true, country: true, publishedAt: true },
    }),
    db.celebrity.findMany({ orderBy: { name: "asc" }, take: 100, select: { id: true, name: true, slug: true, domain: true } }),
  ]);

  return (
    <>
      <PageHead title="Mémoire & HCBE" desc="Lieux de mémoire de la rubrique Racines et fiches des Béninois qui comptent.">
        <Link href="/memoire" className="whitespace-nowrap rounded border border-line bg-paper px-4 py-2 text-sm font-bold text-ink-2 hover:border-primary hover:text-primary">
          Page publique
        </Link>
        <MemoryPlacePanel />
        <CelebrityForm />
      </PageHead>

      <div className="space-y-6">
        <Card title={`Lieux de mémoire (${lieux.length})`}>
          {lieux.length === 0 ? (
            <EmptyState title="Aucun lieu de mémoire enregistré.">
              Utilisez « Nouveau lieu de mémoire » ci-dessus : titre, texte, ville, pays, catégorie, adresse et coordonnées pour la carte.
            </EmptyState>
          ) : (
            <TableShell head={<><Th>Lieu</Th><Th>Localisation</Th><Th>Statut</Th><Th>Publié</Th><Th>&nbsp;</Th></>}>
              {lieux.map((l) => (
                <tr key={l.id} className="hover:bg-primary-faint">
                  <Td className="font-semibold">{l.title}</Td>
                  <Td className="whitespace-nowrap text-ink-2">{[l.city, l.country].filter(Boolean).join(", ") || "—"}</Td>
                  <Td><ContentStatusBadge status={l.status} /></Td>
                  <Td className="whitespace-nowrap text-muted">{fmtDate(l.publishedAt)}</Td>
                  <Td>
                    <div className="flex flex-nowrap justify-end gap-2">
                      <EditLink id={l.id} />
                      {l.status === "PUBLISHED" ? (
                        <Link href={contentHref(l.type, l.slug)} className="whitespace-nowrap rounded border border-line px-2.5 py-1 text-xs font-bold text-ink-2 hover:border-primary hover:text-primary">Voir</Link>
                      ) : l.status !== "IN_MODERATION" ? (
                        <ActionButton action={setContentStatusAction} fields={{ id: l.id, status: "PUBLISHED" }} label="Publier" tone="primary" />
                      ) : null}
                      {l.status !== "ARCHIVED" && l.status !== "IN_MODERATION" && (
                        <ActionButton action={setContentStatusAction} fields={{ id: l.id, status: "ARCHIVED" }} label="Archiver" confirm={`Archiver « ${l.title} » ?`} />
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </TableShell>
          )}
        </Card>

        <Card title={`Béninois qui comptent (${celebrites.length})`}>
          {celebrites.length === 0 ? (
            <EmptyState title="Aucune fiche pour l'instant.">
              Utilisez « Nouvelle personnalité » ci-dessus (nom, domaine, biographie, photo, liens). Les fiches apparaissent sur /magazine/beninois-qui-comptent.
            </EmptyState>
          ) : (
            <TableShell head={<><Th>Nom</Th><Th>Domaine</Th><Th>Adresse</Th></>}>
              {celebrites.map((c) => (
                <tr key={c.id} className="hover:bg-primary-faint">
                  <Td className="font-semibold">{c.name}</Td>
                  <Td className="text-ink-2">{c.domain ?? "—"}</Td>
                  <Td className="text-muted">{c.slug}</Td>
                </tr>
              ))}
            </TableShell>
          )}
          {celebrites.length > 0 && (
            <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
              La modification d&apos;une fiche existante n&apos;est pas encore disponible depuis cette page.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { contentHref } from "@/lib/routes";
import { setContentStatusAction } from "@/lib/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { PageHead, StatCard, Card, TableShell, Th, Td, EmptyState, TypeBadge, ContentStatusBadge, fmtDate, fmtNumber } from "@/components/admin/ui";
import { ArticleForm } from "./article-form";

export const metadata: Metadata = { title: "Rédaction" };

/* Rédaction : tous les articles (rédaction + membres, tous statuts) et création d'un article. */

export default async function RedactionPage() {
  const [articles, publies, brouillons, enModeration] = await Promise.all([
    db.content.findMany({
      where: { type: { in: ["ARTICLE", "MEMBER_ARTICLE"] } },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        title: true,
        slug: true,
        status: true,
        featured: true,
        publishedAt: true,
        updatedAt: true,
        views: true,
        ownerProfile: { select: { displayName: true } },
      },
    }),
    db.content.count({ where: { type: { in: ["ARTICLE", "MEMBER_ARTICLE"] }, status: "PUBLISHED" } }),
    db.content.count({ where: { type: { in: ["ARTICLE", "MEMBER_ARTICLE"] }, status: "DRAFT" } }),
    db.content.count({ where: { type: { in: ["ARTICLE", "MEMBER_ARTICLE"] }, status: "IN_MODERATION" } }),
  ]);

  return (
    <>
      <PageHead title="Rédaction" desc="Articles de la rédaction et des membres, tous statuts confondus.">
        <ArticleForm />
      </PageHead>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Articles en ligne" value={fmtNumber(publies)} />
        <StatCard label="Brouillons" value={fmtNumber(brouillons)} />
        <StatCard label="Articles membres en modération" value={fmtNumber(enModeration)} tone={enModeration ? "warn" : "default"} />
      </div>

      <Card title={`Articles (${articles.length}${articles.length === 100 ? ", 100 plus récents" : ""})`}>
        {articles.length === 0 ? (
          <EmptyState title="Aucun article pour l'instant.">
            Utilisez « Écrire un article » ci-dessus. Les articles déposés par les membres apparaîtront aussi ici.
          </EmptyState>
        ) : (
          <TableShell head={<><Th>Titre</Th><Th>Type</Th><Th>Auteur</Th><Th>Statut</Th><Th>Publié</Th><Th>Vues</Th><Th>&nbsp;</Th></>}>
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-primary-faint">
                <Td className="max-w-[320px]">
                  <p className="truncate font-semibold">{a.title}</p>
                  {a.featured && <p className="text-xs text-muted">À la une</p>}
                </Td>
                <Td><TypeBadge type={a.type} /></Td>
                <Td className="text-ink-2">{a.ownerProfile?.displayName ?? "—"}</Td>
                <Td><ContentStatusBadge status={a.status} /></Td>
                <Td className="whitespace-nowrap text-muted">{fmtDate(a.publishedAt)}</Td>
                <Td className="tabular-nums text-ink-2">{fmtNumber(a.views)}</Td>
                <Td>
                  <div className="flex flex-nowrap justify-end gap-2">
                    {a.status === "PUBLISHED" ? (
                      <Link href={contentHref(a.type, a.slug)} className="whitespace-nowrap rounded border border-line px-2.5 py-1 text-xs font-bold text-ink-2 hover:border-primary hover:text-primary">
                        Voir
                      </Link>
                    ) : a.status === "DRAFT" ? (
                      <ActionButton action={setContentStatusAction} fields={{ id: a.id, status: "PUBLISHED" }} label="Publier" tone="primary" />
                    ) : null}
                    {a.status !== "ARCHIVED" && a.status !== "IN_MODERATION" && (
                      <ActionButton action={setContentStatusAction} fields={{ id: a.id, status: "ARCHIVED" }} label="Archiver" confirm={`Archiver « ${a.title} » ?`} />
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </TableShell>
        )}
        <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
          La modification d&apos;un article existant et la mise à la une ne sont pas encore disponibles depuis cette page.
        </p>
      </Card>
    </>
  );
}

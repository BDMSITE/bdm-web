import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CONTENT_LABEL, contentHref } from "@/lib/routes";
import { PageHead, Card, TableShell, Th, Td, EmptyState, TypeBadge, fmtDateTime } from "@/components/admin/ui";

export const metadata: Metadata = { title: "En direct (ticker)" };

/* Bandeau « En direct » : alimenté automatiquement par les 8 derniers contenus publiés
   (composant LiveTicker). Pas de message épinglé : aucun modèle en base pour l'instant. */

export default async function AdminDirectPage() {
  const items = await db.content.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 8,
    select: { id: true, type: true, title: true, slug: true, city: true, publishedAt: true },
  });

  return (
    <>
      <PageHead
        title="En direct (ticker)"
        desc="Le bandeau qui défile sous la navigation du site est alimenté automatiquement par les 8 derniers contenus publiés, tous types confondus. Il est masqué tant qu'il n'y a rien à annoncer."
      >
        <Link href="/" className="whitespace-nowrap rounded border border-line bg-paper px-4 py-2 text-sm font-bold text-ink-2 hover:border-primary hover:text-primary">
          Voir sur le site
        </Link>
      </PageHead>

      <div className="space-y-6">
        <Card title="Contenu actuel du bandeau">
          {items.length === 0 ? (
            <EmptyState title="Le bandeau est masqué : aucun contenu publié.">
              Dès qu&apos;un contenu est publié (modération, rédaction, emploi…), il apparaît ici et sur le site.
            </EmptyState>
          ) : (
            <TableShell head={<><Th>Ordre</Th><Th>Type</Th><Th>Message affiché</Th><Th>Publié le</Th></>}>
              {items.map((it, i) => (
                <tr key={it.id} className="hover:bg-primary-faint">
                  <Td className="tabular-nums text-muted">{i + 1}</Td>
                  <Td><TypeBadge type={it.type} /></Td>
                  <Td className="font-semibold">
                    <Link href={contentHref(it.type, it.slug)} className="hover:text-primary hover:underline">
                      {CONTENT_LABEL[it.type]} : {it.title}{it.city ? ` — ${it.city}` : ""}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{fmtDateTime(it.publishedAt)}</Td>
                </tr>
              ))}
            </TableShell>
          )}
          <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
            Pour retirer un élément du bandeau, archivez le contenu depuis sa rubrique (Rédaction, Emploi, Services).
          </p>
        </Card>

        <Card title="Messages épinglés">
          <EmptyState title="Épinglage à venir.">
            Il n&apos;existe pas encore de modèle en base pour les messages de la rédaction (annonce HCBE, maintenance, événement à la une). Le bandeau ne diffuse que les contenus réellement publiés.
          </EmptyState>
        </Card>
      </div>
    </>
  );
}

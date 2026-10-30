import Link from "next/link";
import type { Metadata } from "next";
import type { ContentType } from "@prisma/client";
import { db } from "@/lib/db";
import { CONTENT_LABEL, contentHref } from "@/lib/routes";
import { toggleFeaturedAction } from "@/lib/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { tickerItems, TICKER_SIZE } from "@/components/site/live-ticker";
import { PageHead, Card, Badge, TableShell, Th, Td, EmptyState, TypeBadge, fmtDateTime } from "@/components/admin/ui";

export const metadata: Metadata = { title: "En direct (ticker)" };

/* Bandeau « En direct » : les contenus épinglés (Content.featured) passent en tête,
   complétés par les derniers contenus publiés jusqu'à TICKER_SIZE (composant LiveTicker).
   Épingler / désépingler = toggleFeaturedAction. */

export default async function AdminDirectPage() {
  const [bandeau, epingles, recents] = await Promise.all([
    tickerItems(),
    db.content.findMany({
      where: { status: "PUBLISHED", featured: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: { id: true, type: true, title: true, slug: true, city: true, publishedAt: true },
    }),
    db.content.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 30,
      select: { id: true, type: true, title: true, slug: true, city: true, publishedAt: true, featured: true },
    }),
  ]);

  const libelle = (it: { type: ContentType; title: string; city: string | null }) =>
    `${CONTENT_LABEL[it.type]} : ${it.title}${it.city ? ` — ${it.city}` : ""}`;

  return (
    <>
      <PageHead
        title="En direct (ticker)"
        desc={`Le bandeau qui défile sous la navigation du site affiche d'abord les contenus épinglés, puis les derniers contenus publiés, jusqu'à ${TICKER_SIZE} au total. Il est masqué tant qu'il n'y a rien à annoncer.`}
      >
        <Link href="/" className="whitespace-nowrap rounded border border-line bg-paper px-4 py-2 text-sm font-bold text-ink-2 hover:border-primary hover:text-primary">
          Voir sur le site
        </Link>
      </PageHead>

      <div className="space-y-6">
        <Card title="Contenu actuel du bandeau">
          {bandeau.length === 0 ? (
            <EmptyState title="Le bandeau est masqué : aucun contenu publié.">
              Dès qu&apos;un contenu est publié (modération, rédaction, emploi…), il apparaît ici et sur le site.
            </EmptyState>
          ) : (
            <TableShell head={<><Th>Ordre</Th><Th>Type</Th><Th>Message affiché</Th><Th>Publié le</Th><Th>&nbsp;</Th></>}>
              {bandeau.map((it, i) => (
                <tr key={it.id} className="hover:bg-primary-faint">
                  <Td className="tabular-nums text-muted">{i + 1}</Td>
                  <Td><TypeBadge type={it.type} /></Td>
                  <Td className="font-semibold">
                    <Link href={contentHref(it.type, it.slug)} className="hover:text-primary hover:underline">{libelle(it)}</Link>
                    {it.featured && <span className="ml-2"><Badge tone="yellow">Épinglé</Badge></span>}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{fmtDateTime(it.publishedAt)}</Td>
                  <Td>
                    <div className="flex justify-end">
                      <ActionButton action={toggleFeaturedAction} fields={{ id: it.id }} label={it.featured ? "Désépingler" : "Épingler"} tone={it.featured ? "neutral" : "primary"} />
                    </div>
                  </Td>
                </tr>
              ))}
            </TableShell>
          )}
          <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
            Pour retirer un élément non épinglé du bandeau, archivez le contenu depuis sa rubrique (Rédaction, Emploi, Services).
          </p>
        </Card>

        <Card title={`Épinglés actuellement (${epingles.length})`}>
          {epingles.length === 0 ? (
            <EmptyState title="Aucun contenu épinglé.">
              Épinglez un contenu publié depuis la liste ci-dessous : il passera en tête du bandeau tant qu&apos;il reste en ligne.
            </EmptyState>
          ) : (
            <TableShell head={<><Th>Type</Th><Th>Message affiché</Th><Th>Publié le</Th><Th>&nbsp;</Th></>}>
              {epingles.map((it) => (
                <tr key={it.id} className="hover:bg-primary-faint">
                  <Td><TypeBadge type={it.type} /></Td>
                  <Td className="font-semibold">
                    <Link href={contentHref(it.type, it.slug)} className="hover:text-primary hover:underline">{libelle(it)}</Link>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{fmtDateTime(it.publishedAt)}</Td>
                  <Td>
                    <div className="flex justify-end">
                      <ActionButton action={toggleFeaturedAction} fields={{ id: it.id }} label="Désépingler" />
                    </div>
                  </Td>
                </tr>
              ))}
            </TableShell>
          )}
          <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
            Un contenu épinglé est aussi « mis en avant » dans sa rubrique (les articles épinglés passent À la une sur l&apos;accueil).
            {epingles.length > TICKER_SIZE && ` Seuls les ${TICKER_SIZE} épinglés les plus récents tiennent dans le bandeau.`}
          </p>
        </Card>

        <Card title={`Contenus publiés récents (${recents.length})`}>
          {recents.length === 0 ? (
            <EmptyState title="Aucun contenu publié." />
          ) : (
            <TableShell head={<><Th>Type</Th><Th>Contenu</Th><Th>Publié le</Th><Th>&nbsp;</Th></>}>
              {recents.map((it) => (
                <tr key={it.id} className="hover:bg-primary-faint">
                  <Td><TypeBadge type={it.type} /></Td>
                  <Td className="font-semibold">
                    <Link href={contentHref(it.type, it.slug)} className="hover:text-primary hover:underline">{it.title}</Link>
                    {it.city && <span className="ml-1 font-normal text-muted">— {it.city}</span>}
                    {it.featured && <span className="ml-2"><Badge tone="yellow">Épinglé</Badge></span>}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{fmtDateTime(it.publishedAt)}</Td>
                  <Td>
                    <div className="flex justify-end">
                      <ActionButton action={toggleFeaturedAction} fields={{ id: it.id }} label={it.featured ? "Désépingler" : "Épingler"} tone={it.featured ? "neutral" : "primary"} />
                    </div>
                  </Td>
                </tr>
              ))}
            </TableShell>
          )}
        </Card>
      </div>
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONTENT_LABEL, contentHref } from "@/lib/routes";
import { EmptyState, fmtDate } from "@/components/site/content";

export const metadata: Metadata = { title: "Mes publications" };

/* Contenus du membre connecté, tous statuts (CDC §7.16). */

const STATUS: Record<string, { label: string; tone: string }> = {
  PUBLISHED: { label: "En ligne", tone: "bg-primary-light text-primary-dark" },
  IN_MODERATION: { label: "En modération", tone: "bg-accent-light text-ink" },
  DRAFT: { label: "Brouillon", tone: "border border-line bg-paper-2 text-ink-2" },
  SCHEDULED: { label: "Programmé", tone: "bg-accent-light text-ink" },
  REJECTED: { label: "Refusé", tone: "bg-danger-light text-danger" },
  EXPIRED: { label: "Expiré", tone: "border border-line bg-paper-2 text-ink-2" },
  ARCHIVED: { label: "Archivé", tone: "border border-line bg-paper-2 text-ink-2" },
};

export default async function PublicationsPage({ searchParams }: { searchParams: Promise<{ envoye?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  const contents = await db.content.findMany({
    where: { ownerProfile: { userId: session!.user.id } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, type: true, status: true, publishedAt: true, createdAt: true, expiresAt: true },
  });

  return (
    <div className="space-y-5">
      {sp.envoye === "1" && (
        <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">
          Votre contenu a bien été envoyé : il sera relu par la modération avant mise en ligne.
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Mes publications</h1>
          <p className="mt-1 text-sm text-ink-2">Tout ce que vous avez proposé sur le site, avec son statut.</p>
        </div>
        <Link href="/publier" className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
          + Publier
        </Link>
      </div>

      {contents.length === 0 ? (
        <EmptyState
          title="Aucune publication"
          text="Articles, offres, événements, annonces : tout ce que vous proposez passe par le guichet Publier."
          href="/publier"
          cta="Publier un contenu"
        />
      ) : (
        <>
          <p className="text-sm text-ink-2">
            {contents.length} contenu{contents.length > 1 ? "s" : ""}
          </p>
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-paper-2 text-left text-xs font-bold uppercase tracking-wider text-ink-2">
                <tr>
                  <th className="px-4 py-2.5">Contenu</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Statut</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {contents.map((c) => {
                  const st = STATUS[c.status] ?? { label: c.status, tone: "border border-line bg-paper-2 text-ink-2" };
                  return (
                    <tr key={c.id} className="hover:bg-primary-faint">
                      <td className="px-4 py-3 font-bold">{c.title}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-2">{CONTENT_LABEL[c.type]}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {fmtDate(c.publishedAt ?? c.createdAt, { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold ${st.tone}`}>{st.label}</span>
                        {c.status === "PUBLISHED" && c.expiresAt && (
                          <span className="ml-2 whitespace-nowrap text-xs text-muted">jusqu&apos;au {fmtDate(c.expiresAt, { day: "numeric", month: "short" })}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {c.status === "PUBLISHED" ? (
                          <Link href={contentHref(c.type, c.slug)} className="text-xs font-bold uppercase text-primary hover:underline">
                            Voir la fiche
                          </Link>
                        ) : (
                          <span className="text-xs text-muted">Non visible</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-xs text-muted">
        Un contenu « en modération » est visible de vous seul jusqu&apos;à sa validation par la rédaction. La modification et le
        retrait d&apos;un contenu depuis cet espace arrivent prochainement.
      </p>
    </div>
  );
}

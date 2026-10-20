import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONTENT_INCLUDE } from "@/lib/content";
import { CONTENT_LABEL } from "@/lib/routes";
import { ContentCard, EmptyState, fmtDate } from "@/components/site/content";
import { FavoriteButton } from "@/components/site/favorite-button";

export const metadata: Metadata = { title: "Mes favoris" };

/* Favoris du membre connecté : contenus en ligne affichés en cartes,
   contenus retirés ou en attente signalés « plus en ligne ». */

export default async function FavorisPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte/favoris");

  const favorites = await db.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { content: { include: CONTENT_INCLUDE } },
  });

  const now = new Date();
  const online = favorites.filter((f) => f.content.status === "PUBLISHED" && (!f.content.expiresAt || f.content.expiresAt > now));
  const offline = favorites.filter((f) => !online.includes(f));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Mes favoris</h1>
        <p className="mt-1 text-sm text-ink-2">Les contenus que vous avez mis de côté pour les retrouver plus tard.</p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          title="Aucun favori"
          text="Articles, offres, adresses, événements : le bouton « Ajouter aux favoris » d'une fiche la range ici."
          href="/magazine"
          cta="Parcourir le magazine"
        />
      ) : (
        <>
          <p className="text-sm text-ink-2">
            {favorites.length} favori{favorites.length > 1 ? "s" : ""}
            {offline.length > 0 && ` · ${offline.length} plus en ligne`}
          </p>

          {online.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              {online.map((f) => (
                <div key={f.contentId} className="flex flex-col gap-2">
                  <ContentCard item={f.content} />
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Ajouté le {fmtDate(f.createdAt, { day: "numeric", month: "short", year: "numeric" })}</span>
                    <FavoriteButton contentId={f.contentId} initial compact />
                  </div>
                </div>
              ))}
            </div>
          )}

          {offline.length > 0 && (
            <section>
              <h2 className="section-title mb-3 border-b-2 border-line pb-2 text-lg">Plus <em>en ligne</em></h2>
              <ul className="divide-y divide-line border border-line">
                {offline.map((f) => (
                  <li key={f.contentId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-bold text-ink-2">{f.content.title}</p>
                      <p className="text-xs text-muted">{CONTENT_LABEL[f.content.type]} · plus en ligne</p>
                    </div>
                    <FavoriteButton contentId={f.contentId} initial compact />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <p className="text-xs text-muted">
        Un favori retiré du site par son auteur ou par la rédaction reste listé ici tant que vous ne l&apos;enlevez pas.{" "}
        <Link href="/compte/alertes" className="font-bold text-primary hover:underline">Les alertes</Link> vous préviennent des nouveautés.
      </p>
    </div>
  );
}

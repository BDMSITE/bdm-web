import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState, fmtDate } from "@/components/site/content";
import { RelayForm } from "@/components/site/relay-form";
import { contentHref, profileHref } from "@/lib/routes";

export const metadata: Metadata = { title: "Candidatures reçues" };

/* Côté recruteur : candidatures sur mes offres, réponse par relais. */

export default async function CandidaturesRecuesPage() {
  const session = await auth();
  const apps = await db.application.findMany({
    where: { content: { ownerProfile: { userId: session!.user.id } } },
    orderBy: { createdAt: "desc" },
    include: {
      content: { select: { title: true, type: true, slug: true } },
      user: { select: { profile: { select: { id: true, displayName: true, slug: true, city: true, country: true, headline: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Candidatures reçues</h1>
        <p className="mt-1 text-sm text-ink-2">Les candidatures à vos offres. Répondez par le site : l&apos;e-mail du candidat n&apos;est jamais affiché.</p>
      </div>
      {apps.length === 0 ? (
        <EmptyState title="Aucune candidature" text="Dès qu'un membre postule à l'une de vos offres, elle apparaît ici." href="/publier" cta="Déposer une offre" />
      ) : (
        <ul className="space-y-4">
          {apps.map((a) => {
            const p = a.user.profile;
            return (
              <li key={a.id} className="border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {p ? <Link href={profileHref(p.slug)} className="hover:text-primary">{p.displayName}</Link> : "Membre"}
                      {p?.headline && <span className="font-normal text-ink-2"> — {p.headline}</span>}
                    </p>
                    <p className="card-location mt-0.5">{[p?.city, p?.country].filter(Boolean).join(" · ")}</p>
                    <p className="mt-1 text-xs text-muted">
                      Pour <Link href={contentHref(a.content.type, a.content.slug)} className="font-semibold text-primary hover:underline">{a.content.title}</Link> · {fmtDate(a.createdAt)}
                    </p>
                  </div>
                  {a.cvUrl && (
                    <a href={a.cvUrl} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap rounded border-2 border-primary px-3 py-1.5 text-xs font-bold uppercase text-primary hover:bg-primary hover:text-white">
                      Voir le CV
                    </a>
                  )}
                </div>
                {a.message && <p className="mt-3 whitespace-pre-line border-l-4 border-line pl-3 text-sm">{a.message}</p>}
                {p && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-bold text-primary">Répondre à {p.displayName.split(" ")[0]}</summary>
                    <div className="mt-3"><RelayForm toProfileId={p.id} contentId={a.contentId} label="Envoyer la réponse" compact /></div>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

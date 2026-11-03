import Link from "next/link";
import { Avatar } from "@/components/site/avatar";
import { profileHref } from "@/lib/routes";
import { RecommendForm, type MyReco } from "@/components/site/recommend";

/* Bloc « Recommandations » d'une fiche membre ou d'une bonne adresse : liste publiée + formulaire. */

export type RecoItem = { id: string; text: string; createdAt: Date; author: { profile: { slug: string; displayName: string; photo: string | null } | null } };

export function RecommendationsBlock({ items, profileId, contentId, retour, mine, viewerConnected, canRecommend, cible }: { items: RecoItem[]; profileId?: string; contentId?: string; retour: string; mine: MyReco; viewerConnected: boolean; canRecommend: boolean; cible: string }) {
  const n = items.length;
  return (
    <section id="recommandations" className="border border-line p-5">
      <h2 className="section-title text-lg">
        {n === 0 ? "Recommandations" : <>{n} <em>recommandation{n > 1 ? "s" : ""}</em></>}
      </h2>
      {n === 0 ? (
        <p className="mt-2 text-sm text-muted">Aucune recommandation publiée pour l&apos;instant.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map((r) => (
            <li key={r.id} className="flex gap-3">
              <Avatar name={r.author.profile?.displayName ?? "Membre"} photo={r.author.profile?.photo ?? null} />
              <div className="min-w-0">
                <p className="text-sm italic leading-relaxed text-ink">« {r.text} »</p>
                <p className="mt-1 text-xs text-muted">
                  {r.author.profile ? <Link href={profileHref(r.author.profile.slug)} className="font-bold text-primary hover:underline">{r.author.profile.displayName}</Link> : "Membre"}
                  {" · "}{r.createdAt.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {canRecommend && (
        <div className="mt-5 border-t border-line pt-4">
          <RecommendForm profileId={profileId} contentId={contentId} retour={retour} mine={mine} connected={viewerConnected} cible={cible} />
        </div>
      )}
    </section>
  );
}

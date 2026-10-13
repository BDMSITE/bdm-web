import Link from "next/link";
import { Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONTENT_LABEL } from "@/lib/routes";

/* Tableau de bord membre : l'activité du compte connecté. */

const STATUS: Record<string, { label: string; ok: boolean }> = {
  PUBLISHED: { label: "En ligne", ok: true },
  IN_MODERATION: { label: "En modération", ok: false },
  DRAFT: { label: "Brouillon", ok: false },
  SCHEDULED: { label: "Programmé", ok: false },
  REJECTED: { label: "Refusé", ok: false },
  EXPIRED: { label: "Expiré", ok: false },
  ARCHIVED: { label: "Archivé", ok: false },
};

export default async function ComptePage({ searchParams }: { searchParams: Promise<{ acces?: string }> }) {
  const [session, sp] = await Promise.all([auth(), searchParams]);
  const userId = session!.user.id;

  const [profile, contents, nbPublished, nbAlerts, alerts] = await Promise.all([
    db.profile.findUnique({ where: { userId }, select: { id: true, displayName: true, cvPublished: true, cvUrl: true, slug: true } }),
    db.content.findMany({
      where: { ownerProfile: { userId } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, type: true, status: true },
    }),
    db.content.count({ where: { ownerProfile: { userId }, status: "PUBLISHED" } }),
    db.alert.count({ where: { userId } }),
    db.alert.findMany({ where: { userId }, take: 3, select: { id: true, keywordIds: true } }),
  ]);
  const prenom = (profile?.displayName ?? session!.user.name ?? "").split(" ")[0];

  return (
    <div className="space-y-8">
      {sp.acces === "refuse" && (
        <p role="alert" className="rounded border border-accent bg-accent-light px-3 py-2.5 text-sm">
          L&apos;administration est réservée à la rédaction et à la modération.
        </p>
      )}

      <div>
        <h1 className="font-display text-2xl font-extrabold">Bonjour {prenom}</h1>
        <p className="mt-1 text-sm text-ink-2">Voici l&apos;activité de votre compte.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { n: nbPublished, l: `publication${nbPublished > 1 ? "s" : ""} en ligne`, href: "/compte/publications" },
          { n: nbAlerts, l: `alerte${nbAlerts > 1 ? "s" : ""} active${nbAlerts > 1 ? "s" : ""}`, href: "/compte/alertes" },
          { n: profile?.cvPublished ? "Oui" : "Non", l: "CV visible des recruteurs", href: "/compte/cv" },
        ].map((s) => (
          <Link key={s.l} href={s.href} className="border border-line p-4 hover:border-primary">
            <span className="font-display text-3xl font-extrabold text-primary">{s.n}</span>
            <p className="text-sm text-ink-2">{s.l}</p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">
          Mes <em>publications</em>
        </h2>
        {contents.length === 0 ? (
          <p className="border border-line p-5 text-sm text-muted">
            Vous n&apos;avez encore rien publié. Articles, offres, événements, annonces : tout passe par le guichet Publier.
          </p>
        ) : (
          <ul className="divide-y divide-line border border-line text-sm">
            {contents.map((c) => {
              const st = STATUS[c.status] ?? { label: c.status, ok: false };
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 p-4">
                  <span className="whitespace-nowrap rounded bg-primary-light px-2 py-0.5 text-xs font-bold uppercase text-primary-dark">
                    {CONTENT_LABEL[c.type]}
                  </span>
                  <p className="min-w-0 flex-1 font-bold">{c.title}</p>
                  <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold ${st.ok ? "bg-primary-light text-primary-dark" : "bg-accent-light text-ink"}`}>
                    {st.label}
                  </span>
                  <Link href="/compte/publications" className="whitespace-nowrap text-xs font-bold uppercase text-primary hover:underline">
                    Gérer
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/publier" className="mt-4 inline-block rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
          + Publier un contenu
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-line p-5">
          <h2 className="section-title text-base">
            Mes <em>alertes</em>
          </h2>
          {alerts.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Aucune alerte : recevez par e-mail les offres et événements qui vous correspondent.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {alerts.map((a) => (
                <span key={a.id} className="flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-sm font-semibold text-primary-dark">
                  <Bell aria-hidden className="h-3.5 w-3.5" /> {(a.keywordIds as string[]).length} mot{(a.keywordIds as string[]).length > 1 ? "s" : ""}-clé{(a.keywordIds as string[]).length > 1 ? "s" : ""}
                </span>
              ))}
            </div>
          )}
          <Link href="/compte/alertes" className="mt-3 inline-block text-xs font-bold uppercase text-primary hover:underline">
            Gérer mes alertes →
          </Link>
        </div>
        <div className="border border-line bg-paper-2 p-5">
          <h2 className="section-title text-base">
            Mon <em>profil public</em>
          </h2>
          <p className="mt-3 text-sm text-ink-2">
            {profile ? (
              <>
                Visible dans l&apos;annuaire :{" "}
                <Link href={`/communaute/membres/${profile.slug}`} className="font-bold text-primary hover:underline">
                  voir ma fiche
                </Link>
              </>
            ) : (
              "Profil non créé."
            )}
          </p>
          <Link href="/compte/profil" className="mt-3 inline-block text-xs font-bold uppercase text-primary hover:underline">
            Modifier mon profil →
          </Link>
        </div>
      </section>
    </div>
  );
}

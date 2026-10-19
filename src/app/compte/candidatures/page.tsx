import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentHref } from "@/lib/routes";
import { EmptyState, fmtDate } from "@/components/site/content";

export const metadata: Metadata = { title: "Mes candidatures" };

/* Candidatures envoyées par le membre connecté (CDC §7.3). */

const STATUS: Record<string, { label: string; tone: string }> = {
  sent: { label: "Transmise", tone: "border border-line bg-paper-2 text-ink-2" },
  viewed: { label: "CV consulté", tone: "bg-primary-light text-primary-dark" },
  interview: { label: "Entretien proposé", tone: "bg-accent-light text-ink" },
  declined: { label: "Non retenue", tone: "border border-line bg-paper-2 text-ink-2" },
};

export default async function CandidaturesPage() {
  const session = await auth();
  const applications = await db.application.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      content: { select: { title: true, slug: true, type: true, status: true, city: true, country: true, ownerProfile: { select: { displayName: true } } } },
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Mes candidatures</h1>
        <p className="mt-1 text-sm text-ink-2">Le suivi des candidatures envoyées depuis le site.</p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title="Aucune candidature"
          text="Vous n'avez pas encore postulé à une offre depuis le site."
          href="/emploi"
          cta="Voir les offres"
        />
      ) : (
        <>
          <p className="text-sm text-ink-2">
            {applications.length} candidature{applications.length > 1 ? "s" : ""}
          </p>
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-paper-2 text-left text-xs font-bold uppercase tracking-wider text-ink-2">
                <tr>
                  <th className="px-4 py-2.5">Offre</th>
                  <th className="px-4 py-2.5">Recruteur</th>
                  <th className="px-4 py-2.5">Envoyée</th>
                  <th className="px-4 py-2.5">Statut</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {applications.map((a) => {
                  const st = STATUS[a.status] ?? { label: a.status, tone: "border border-line bg-paper-2 text-ink-2" };
                  const lieu = [a.content.city, a.content.country].filter(Boolean).join(", ");
                  return (
                    <tr key={a.id} className="hover:bg-primary-faint">
                      <td className="px-4 py-3 font-bold">{a.content.title}</td>
                      <td className="px-4 py-3 text-ink-2">
                        {[a.content.ownerProfile?.displayName, lieu].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(a.createdAt, { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-4 py-3">
                        <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold ${st.tone}`}>{st.label}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {a.content.status === "PUBLISHED" ? (
                          <Link href={contentHref(a.content.type, a.content.slug)} className="text-xs font-bold uppercase text-primary hover:underline">
                            Voir l&apos;offre
                          </Link>
                        ) : (
                          <span className="text-xs text-muted">Offre retirée</span>
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
        « Transmise » : le recruteur a reçu votre candidature. Votre e-mail n&apos;est jamais communiqué sans votre action.
      </p>
      <Link href="/emploi" className="inline-block rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
        Voir les offres du moment
      </Link>
    </div>
  );
}

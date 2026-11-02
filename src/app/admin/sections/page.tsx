import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { PageHead, StatCard, Card, EmptyState, fmtNumber } from "@/components/admin/ui";
import { SectionForm } from "./section-form";

export const metadata: Metadata = { title: "Sections locales du HCBE" };

/* Sections locales : la structure réelle du HCBE pays par pays. Affichées sur /hcbe et sur
   chaque page pays ; le contact passe par la messagerie relais du membre responsable. */

export default async function AdminSectionsPage() {
  const rows = await db.hcbeSection.findMany({ orderBy: [{ country: "asc" }, { name: "asc" }], include: { contactProfile: { select: { displayName: true, user: { select: { email: true } } } } } });
  const pays = [...new Set(rows.map((r) => r.country))];
  return (
    <>
      <PageHead title="Sections locales du HCBE" desc="Une section par pays ou par région : nom, présentation, membre responsable (joignable par la messagerie du site), lien. Visible sur la page HCBE et sur chaque page pays." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Sections" value={fmtNumber(rows.length)} />
        <StatCard label="Pays couverts" value={fmtNumber(pays.length)} />
        <StatCard label="Avec un responsable joignable" value={fmtNumber(rows.filter((r) => r.contactProfileId).length)} />
      </div>
      <Card className="mt-6" title="Ajouter une section">
        <SectionForm />
      </Card>
      <Card className="mt-6" title={`Sections enregistrées (${rows.length})`}>
        {rows.length === 0 ? (
          <EmptyState title="Aucune section enregistrée.">Les pages pays indiquent aux visiteurs d&apos;écrire au HCBE via le formulaire de contact.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id}>
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-primary-faint">
                    <span className="font-bold">{r.name}</span>
                    <span className="text-ink-2">{[r.city, r.country].filter(Boolean).join(" · ")}</span>
                    {r.contactProfile && <span className="text-xs text-muted">responsable : {r.contactProfile.displayName}</span>}
                    <Link href={`/pays/${slugify(r.country)}`} className="ml-auto text-xs font-bold uppercase text-primary hover:underline">Page pays</Link>
                  </summary>
                  <SectionForm values={{ id: r.id, country: r.country, city: r.city ?? "", name: r.name, description: r.description ?? "", contactEmail: r.contactProfile?.user.email ?? "", website: r.website ?? "" }} />
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

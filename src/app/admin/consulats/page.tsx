import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { CONSULATE_KIND_LABEL } from "@/lib/consulats";
import { PageHead, StatCard, Card, EmptyState, fmtNumber } from "@/components/admin/ui";
import { ConsulateForm } from "./consulate-form";

export const metadata: Metadata = { title: "Ambassades & consulats" };

/* Représentations du Bénin à l'étranger : saisies par l'équipe, affichées sur la page HCBE
   et sur chaque page pays. Aucune donnée n'est pré-remplie : tout vient du HCBE. */

export default async function AdminConsulatsPage() {
  const rows = await db.consulate.findMany({ orderBy: [{ country: "asc" }, { kind: "asc" }, { city: "asc" }] });
  const pays = [...new Set(rows.map((r) => r.country))];
  return (
    <>
      <PageHead title="Ambassades & consulats" desc="Coordonnées officielles des représentations du Bénin : visibles sur la page HCBE et sur chaque page pays. Saisissez uniquement des informations vérifiées." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Représentations" value={fmtNumber(rows.length)} />
        <StatCard label="Pays couverts" value={fmtNumber(pays.length)} />
        <StatCard label="Page publique" value="HCBE" hint="/hcbe et /pays/…" />
      </div>
      <Card className="mt-6" title="Ajouter une représentation">
        <ConsulateForm />
      </Card>
      <Card className="mt-6" title={`Représentations enregistrées (${rows.length})`}>
        {rows.length === 0 ? (
          <EmptyState title="Aucune représentation enregistrée.">Les pages publiques indiquent que la liste est en attente de validation par le HCBE.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id}>
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-primary-faint">
                    <span className="font-bold">{r.name}</span>
                    <span className="text-ink-2">{CONSULATE_KIND_LABEL[r.kind] ?? r.kind} · {r.city}</span>
                    <Link href={`/pays/${slugify(r.country)}`} className="ml-auto text-xs font-bold uppercase text-primary hover:underline">{r.country}</Link>
                  </summary>
                  <ConsulateForm values={{ id: r.id, country: r.country, city: r.city, kind: r.kind, name: r.name, address: r.address ?? "", phone: r.phone ?? "", email: r.email ?? "", website: r.website ?? "", hours: r.hours ?? "", notes: r.notes ?? "" }} />
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

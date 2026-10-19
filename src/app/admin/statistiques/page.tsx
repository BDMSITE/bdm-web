import type { Metadata } from "next";
import type { ContentType } from "@prisma/client";
import { db } from "@/lib/db";
import { CONTENT_LABEL } from "@/lib/routes";
import { PageHead, StatCard, Card, EmptyState, fmtNumber } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Statistiques" };

/* Statistiques : uniquement des chiffres calculés depuis la base.
   Le trafic web (visites, pages vues) viendra d'un outil d'analytics branché plus tard. */

function Bars({ rows, vide }: { rows: { label: string; n: number }[]; vide: string }) {
  if (rows.length === 0) return <EmptyState title={vide} />;
  const max = Math.max(...rows.map((r) => r.n), 1);
  return (
    <ul className="divide-y divide-line text-sm">
      {rows.map((r) => (
        <li key={r.label} className="px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{r.label}</span>
            <span className="tabular-nums text-ink-2">{fmtNumber(r.n)}</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded bg-paper-2">
            <div className="h-1.5 rounded bg-primary" style={{ width: `${Math.round((r.n / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminStatistiquesPage() {
  const now = new Date();
  const debut = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [publiesParType, membresParPays, inscriptions, membresActifs, contenusPublies, vuesTotales] = await Promise.all([
    db.content.groupBy({ by: ["type"], where: { status: "PUBLISHED" }, _count: { _all: true } }),
    db.profile.groupBy({ by: ["country"], where: { user: { status: "ACTIVE" }, country: { not: null } }, _count: { _all: true } }),
    db.user.findMany({ where: { createdAt: { gte: debut }, importedFrom: null }, select: { createdAt: true } }),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.content.count({ where: { status: "PUBLISHED" } }),
    db.content.aggregate({ where: { status: "PUBLISHED" }, _sum: { views: true } }),
  ]);

  const parType = publiesParType
    .map((g) => ({ label: CONTENT_LABEL[g.type as ContentType], n: g._count._all }))
    .sort((a, b) => b.n - a.n);

  const parPays = membresParPays
    .map((g) => ({ label: g.country ?? "—", n: g._count._all }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 15);

  const mois: { label: string; n: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const n = inscriptions.filter((u) => u.createdAt.getFullYear() === d.getFullYear() && u.createdAt.getMonth() === d.getMonth()).length;
    mois.push({ label: label.charAt(0).toUpperCase() + label.slice(1), n });
  }

  return (
    <>
      <PageHead title="Statistiques" desc="Chiffres calculés depuis la base du site. Le trafic web (visites, pages vues, provenance) viendra d'un outil d'analytics branché ultérieurement." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Membres actifs" value={fmtNumber(membresActifs)} hint="e-mail confirmé" />
        <StatCard label="Contenus en ligne" value={fmtNumber(contenusPublies)} />
        <StatCard label="Vues cumulées des contenus" value={fmtNumber(vuesTotales._sum.views ?? 0)} hint="compteur interne des fiches" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Contenus en ligne par type">
          <Bars rows={parType} vide="Aucun contenu publié." />
        </Card>
        <Card title="Membres actifs par pays (15 premiers)">
          <Bars rows={parPays} vide="Aucun membre actif avec un pays renseigné." />
        </Card>
        <Card title="Inscriptions par mois (6 derniers mois)">
          <Bars rows={mois} vide="Aucune inscription." />
          <p className="border-t border-line px-4 py-2.5 text-xs text-muted">Hors comptes importés depuis la base Excel du HCBE.</p>
        </Card>
      </div>
    </>
  );
}

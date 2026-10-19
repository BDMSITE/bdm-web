import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHead, StatCard, Card, Badge, TableShell, Th, Td, EmptyState, fmtDate, fmtNumber } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Régie pub" };

/* Régie : bannières (Banner) et partenaires (Partner). Lecture seule pour l'instant. */

const SLOT_LABEL: Record<string, string> = {
  top: "Bandeau haut",
  side1: "Colonne 1",
  side2: "Colonne 2",
  mid: "Pavé milieu",
  bottom: "Bas de page",
  promo: "Promo",
};

const PARTNER_LABEL: Record<string, string> = {
  rh: "Partenaire RH",
  annonceur: "Annonceur",
  avantages: "Avantages membres",
};

export default async function AdminRegiePage() {
  const now = new Date();
  const [bannieres, partenaires] = await Promise.all([
    db.banner.findMany({ orderBy: { endsAt: "desc" }, take: 50 }),
    db.partner.findMany({
      orderBy: { startsAt: "desc" },
      take: 50,
      select: { id: true, type: true, plan: true, startsAt: true, endsAt: true, profile: { select: { displayName: true, slug: true } } },
    }),
  ]);
  const actives = bannieres.filter((b) => b.startsAt <= now && b.endsAt >= now).length;

  return (
    <>
      <PageHead title="Régie pub" desc="Bannières programmées et partenaires (RH, annonceurs, avantages)." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Bannières actives" value={fmtNumber(actives)} hint="en cours de diffusion aujourd'hui" />
        <StatCard label="Bannières enregistrées" value={fmtNumber(bannieres.length)} />
        <StatCard label="Partenaires" value={fmtNumber(partenaires.length)} />
      </div>

      <div className="mt-6 space-y-6">
        <Card title="Bannières">
          {bannieres.length === 0 ? (
            <EmptyState title="Aucune bannière enregistrée.">
              Le modèle existe en base (image, lien, emplacement, période, poids, impressions, clics) mais la création depuis le back-office n&apos;est pas encore disponible. Aucune publicité n&apos;est diffusée sur le site.
            </EmptyState>
          ) : (
            <TableShell head={<><Th>Emplacement</Th><Th>Lien</Th><Th>Période</Th><Th>Impressions</Th><Th>Clics</Th><Th>État</Th></>}>
              {bannieres.map((b) => {
                const active = b.startsAt <= now && b.endsAt >= now;
                return (
                  <tr key={b.id} className="hover:bg-primary-faint">
                    <Td className="font-semibold">{SLOT_LABEL[b.slot] ?? b.slot}</Td>
                    <Td className="max-w-[260px] truncate text-ink-2">{b.link}</Td>
                    <Td className="whitespace-nowrap text-muted">{fmtDate(b.startsAt)} → {fmtDate(b.endsAt)}</Td>
                    <Td className="tabular-nums text-ink-2">{fmtNumber(b.impressions)}</Td>
                    <Td className="tabular-nums text-ink-2">{fmtNumber(b.clicks)}</Td>
                    <Td>{active ? <Badge tone="green">En diffusion</Badge> : b.endsAt < now ? <Badge tone="gray">Terminée</Badge> : <Badge tone="blue">Programmée</Badge>}</Td>
                  </tr>
                );
              })}
            </TableShell>
          )}
        </Card>

        <Card title="Partenaires">
          {partenaires.length === 0 ? (
            <EmptyState title="Aucun partenaire enregistré.">
              Un partenaire est un compte entreprise ou association lié à une formule (RH, annonceur, avantages). La gestion des partenariats arrivera avec la monétisation (FedaPay).
            </EmptyState>
          ) : (
            <TableShell head={<><Th>Partenaire</Th><Th>Type</Th><Th>Formule</Th><Th>Début</Th><Th>Fin</Th></>}>
              {partenaires.map((p) => (
                <tr key={p.id} className="hover:bg-primary-faint">
                  <Td className="font-semibold">{p.profile.displayName}</Td>
                  <Td className="text-ink-2">{PARTNER_LABEL[p.type] ?? p.type}</Td>
                  <Td className="text-ink-2">{p.plan ?? "—"}</Td>
                  <Td className="whitespace-nowrap text-muted">{fmtDate(p.startsAt)}</Td>
                  <Td className="whitespace-nowrap text-muted">{p.endsAt ? fmtDate(p.endsAt) : "Sans fin"}</Td>
                </tr>
              ))}
            </TableShell>
          )}
        </Card>
      </div>
    </>
  );
}

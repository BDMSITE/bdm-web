import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { SLOTS, SLOT_BY_CODE } from "@/lib/pub";
import { setBannerStatusAction } from "@/lib/actions/regie";
import { RegieActionButton } from "./action-button";
import { PageHead, StatCard, Card, Badge, TableShell, Th, Td, EmptyState, fmtDate, fmtNumber } from "@/components/admin/ui";
import { NewBannerPanel } from "./banner-form";

export const metadata: Metadata = { title: "Régie pub" };

/* Régie : campagnes par emplacement (vendues et maison), statuts, stats,
   partenaires. Accessible aux rôles Régie et Admin. */

const STATUT: Record<string, { l: string; tone: "green" | "gray" | "blue" | "yellow" | "red" }> = {
  DRAFT: { l: "Brouillon", tone: "gray" },
  IN_MODERATION: { l: "À valider", tone: "yellow" },
  PUBLISHED: { l: "En diffusion", tone: "green" },
  REJECTED: { l: "Refusée", tone: "red" },
  ARCHIVED: { l: "Archivée", tone: "gray" },
};

const PARTNER_LABEL: Record<string, string> = { rh: "Partenaire RH", annonceur: "Annonceur", avantages: "Avantages membres" };

export default async function AdminRegiePage() {
  const now = new Date();
  const depuis30j = new Date(now.getTime() - 30 * 864e5);
  const [campagnes, partenaires, stats30] = await Promise.all([
    db.banner.findMany({ orderBy: [{ status: "asc" }, { updatedAt: "desc" }], take: 200 }),
    db.partner.findMany({ orderBy: { startsAt: "desc" }, take: 50, select: { id: true, type: true, plan: true, startsAt: true, endsAt: true, profile: { select: { displayName: true } } } }),
    db.bannerStat.aggregate({ where: { day: { gte: depuis30j } }, _sum: { impressions: true, clicks: true } }),
  ]);
  const enDiffusion = (b: (typeof campagnes)[number]) => b.status === "PUBLISHED" && b.startsAt <= now && (!b.endsAt || b.endsAt >= now);
  const actives = campagnes.filter(enDiffusion);
  const vendues = actives.filter((b) => !b.house).length;
  const aValider = campagnes.filter((b) => b.status === "IN_MODERATION").length;
  const imp30 = stats30._sum.impressions ?? 0;
  const clics30 = stats30._sum.clicks ?? 0;

  return (
    <>
      <PageHead title="Régie pub" desc="Campagnes par emplacement : vendues en priorité, campagnes maison en repli. Un emplacement n'est jamais vide.">
        <NewBannerPanel />
      </PageHead>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="En diffusion" value={fmtNumber(actives.length)} hint={`${vendues} vendue${vendues > 1 ? "s" : ""}, ${actives.length - vendues} maison`} />
        <StatCard label="À valider" value={fmtNumber(aValider)} tone={aValider ? "warn" : "default"} />
        <StatCard label="Affichages 30 j" value={fmtNumber(imp30)} />
        <StatCard label="Clics 30 j" value={fmtNumber(clics30)} hint={imp30 ? `taux ${((clics30 / imp30) * 100).toFixed(2)} %` : undefined} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {SLOTS.map((s) => {
          const n = actives.filter((b) => b.slot === s.code);
          return (
            <div key={s.code} className="rounded border border-line bg-paper p-4 text-sm">
              <p className="font-bold">{s.label}</p>
              <p className="text-xs text-muted">{s.desktop.w}×{s.desktop.h} · mobile {s.mobile.w}×{s.mobile.h}</p>
              <p className="mt-2">{n.length === 0 ? <span className="text-danger">Vide : rien ne s&apos;affiche</span> : `${n.length} campagne${n.length > 1 ? "s" : ""} en rotation`}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-6">
        <Card title="Campagnes">
          {campagnes.length === 0 ? (
            <EmptyState title="Aucune campagne.">Créez une campagne ou lancez les campagnes maison des sites du groupe (pnpm pub:maison).</EmptyState>
          ) : (
            <TableShell head={<><Th>Campagne</Th><Th>Emplacement</Th><Th>Période</Th><Th>Affich.</Th><Th>Clics</Th><Th>État</Th><Th>Actions</Th></>}>
              {campagnes.map((b) => {
                const st = STATUT[b.status];
                return (
                  <tr key={b.id} className="hover:bg-primary-faint">
                    <Td>
                      <Link href={`/admin/regie/${b.id}`} className="font-semibold hover:text-primary hover:underline">{b.title}</Link>
                      <p className="text-xs text-muted">{b.advertiser}{b.house ? " · maison" : ""} · {b.kind === "CARD" ? "carte" : "visuel"} · poids {b.weight}</p>
                    </Td>
                    <Td className="whitespace-nowrap text-ink-2">{SLOT_BY_CODE[b.slot].label}</Td>
                    <Td className="whitespace-nowrap text-muted">{fmtDate(b.startsAt)} → {b.endsAt ? fmtDate(b.endsAt) : "∞"}</Td>
                    <Td className="tabular-nums text-ink-2">{fmtNumber(b.impressions)}</Td>
                    <Td className="tabular-nums text-ink-2">{fmtNumber(b.clicks)}</Td>
                    <Td><Badge tone={st.tone}>{enDiffusion(b) ? "En diffusion" : st.l}</Badge></Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        {b.status !== "PUBLISHED" && <RegieActionButton action={setBannerStatusAction} fields={{ id: b.id, status: "PUBLISHED" }} label="Diffuser" tone="primary" />}
                        {b.status === "PUBLISHED" && <RegieActionButton action={setBannerStatusAction} fields={{ id: b.id, status: "ARCHIVED" }} label="Arrêter" />}
                        {b.status === "IN_MODERATION" && <RegieActionButton action={setBannerStatusAction} fields={{ id: b.id, status: "REJECTED" }} label="Refuser" tone="danger" />}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </TableShell>
          )}
        </Card>

        <Card title="Partenaires">
          {partenaires.length === 0 ? (
            <EmptyState title="Aucun partenaire enregistré.">Un partenaire est un compte entreprise ou association lié à une formule (RH, annonceur, avantages). Arrive avec le libre-service annonceur et FedaPay.</EmptyState>
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

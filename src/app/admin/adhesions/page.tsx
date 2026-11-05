import Link from "next/link";
import type { Metadata } from "next";
import type { MembershipStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fedapayConfigured, FEDAPAY_LIVE } from "@/lib/fedapay";
import { adhesionProposee, PLAN_LABEL, RAPPEL_JOURS } from "@/lib/adhesion";
import { cancelMembershipAction } from "@/lib/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { PageHead, StatCard, Card, Badge, TableShell, Th, Td, EmptyState, fmtDate, fmtNumber } from "@/components/admin/ui";
import { ManualMembershipForm } from "./manual-form";

export const metadata: Metadata = { title: "Adhésions HCBE" };

/* Adhésions HCBE (F-156) : adhérents en cours, échéances proches, encaissements FedaPay,
   activation manuelle (paiement hors ligne, membre d'honneur), retrait, export CSV. */

export const dynamic = "force-dynamic";

const PAR_PAGE = 50;
const STATUT_LABEL: Record<MembershipStatus, string> = { ACTIVE: "En cours", PENDING: "Paiement en attente", EXPIRED: "Échue", CANCELLED: "Annulée / retirée" };
const STATUT_TONE: Record<MembershipStatus, "green" | "yellow" | "gray" | "red"> = { ACTIVE: "green", PENDING: "yellow", EXPIRED: "gray", CANCELLED: "red" };

export default async function AdminAdhesionsPage({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const statut = (["ACTIVE", "PENDING", "EXPIRED", "CANCELLED"] as const).find((s) => s === sp.statut);
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const now = new Date();
  const dans30j = new Date(now.getTime() + RAPPEL_JOURS * 864e5);
  const debutAnnee = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const where = {
    ...(statut ? { status: statut } : {}),
    ...(q && { user: { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { profile: { displayName: { contains: q, mode: "insensitive" as const } } }] } }),
  };

  const [session, proposee, actifs, expirant, payeesAnnee, encaisseAnnee, enAttente, total, lignes] = await Promise.all([
    auth(),
    adhesionProposee(),
    db.membership.count({ where: { status: "ACTIVE", endsAt: { gt: now } } }),
    db.membership.count({ where: { status: "ACTIVE", endsAt: { gt: now, lte: dans30j } } }),
    db.membership.count({ where: { status: "ACTIVE", paymentRef: { not: null }, amount: { gt: 0 }, startsAt: { gte: debutAnnee } } }),
    db.membership.aggregate({ where: { status: { in: ["ACTIVE", "EXPIRED"] }, paymentRef: { not: null }, startsAt: { gte: debutAnnee } }, _sum: { amount: true } }),
    db.membership.count({ where: { status: "PENDING" } }),
    db.membership.count({ where }),
    db.membership.findMany({
      where,
      orderBy: [{ status: "asc" }, { endsAt: "asc" }, { createdAt: "desc" }],
      take: PAR_PAGE,
      skip: (page - 1) * PAR_PAGE,
      select: { id: true, plan: true, status: true, startsAt: true, endsAt: true, displayAmount: true, amount: true, paymentRef: true, paymentMode: true, createdById: true, note: true, createdAt: true, user: { select: { email: true, profile: { select: { displayName: true, slug: true, country: true } } } } },
    }),
  ]);
  const isAdmin = session?.user?.role === "ADMIN";
  const pages = Math.max(1, Math.ceil(total / PAR_PAGE));
  const lien = (p: number) => {
    const u = new URLSearchParams();
    if (statut) u.set("statut", statut);
    if (q) u.set("q", q);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/adhesions${s ? `?${s}` : ""}`;
  };
  const INPUT = "rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

  return (
    <>
      <PageHead title="Adhésions HCBE" desc="Inscription gratuite pour tous ; adhésion annuelle facultative (20 €, 5 € jeunes et étudiants), payée via FedaPay ou activée ici à la main. Aucun prélèvement automatique : rappel 30 jours avant l'échéance.">
        {isAdmin && (
          <a href="/api/admin/export/adhesions" className="whitespace-nowrap rounded border border-line bg-paper px-4 py-2 text-sm font-bold text-ink-2 hover:border-primary hover:text-primary">Exporter (CSV)</a>
        )}
        <Link href="/admin/parametres" className="whitespace-nowrap rounded border border-line bg-paper px-4 py-2 text-sm font-bold text-ink-2 hover:border-primary hover:text-primary">Tarifs & interrupteur</Link>
      </PageHead>

      {!proposee && (
        <p className="mb-4 rounded border border-accent bg-accent-light px-3 py-2.5 text-sm">
          L&apos;adhésion n&apos;est <strong>pas encore proposée</strong> aux membres : la page « Mon adhésion » et le badge sont masqués. Activer « Proposer l&apos;adhésion HCBE » dans Paramètres → Sécurité &amp; validation quand le HCBE est prêt. L&apos;activation manuelle ci-dessous fonctionne dès maintenant.
        </p>
      )}
      {proposee && !fedapayConfigured() && (
        <p className="mb-4 rounded border border-accent bg-accent-light px-3 py-2.5 text-sm">
          Paiement en ligne indisponible : poser <code className="rounded bg-paper-2 px-1">FEDAPAY_PUBLIC_KEY</code>, <code className="rounded bg-paper-2 px-1">FEDAPAY_SECRET_KEY</code> et <code className="rounded bg-paper-2 px-1">FEDAPAY_WEBHOOK_SECRET</code> dans Vercel. En attendant, les membres sont invités à écrire au HCBE et vous activez ici.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Adhérents en cours" value={fmtNumber(actifs)} />
        <StatCard label={`Échéance sous ${RAPPEL_JOURS} jours`} value={fmtNumber(expirant)} tone={expirant ? "warn" : "default"} hint="Rappel envoyé automatiquement par le cron" />
        <StatCard label={`Paiements FedaPay ${now.getUTCFullYear()}`} value={fmtNumber(payeesAnnee)} hint={`${fmtNumber(encaisseAnnee._sum.amount ?? 0)} FCFA encaissés${fedapayConfigured() ? (FEDAPAY_LIVE ? "" : " (sandbox)") : ""}`} />
        <StatCard label="Paiements en attente" value={fmtNumber(enAttente)} hint="Tentatives non abouties (nettoyées automatiquement)" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <form action="/admin/adhesions" className="flex flex-wrap items-center gap-2">
            <input type="search" name="q" defaultValue={q} aria-label="Rechercher un adhérent" placeholder="Nom ou e-mail…" className={`${INPUT} w-full sm:w-64`} />
            <select name="statut" defaultValue={statut ?? ""} aria-label="Statut" className={INPUT}>
              <option value="">Tous les statuts</option>
              {(Object.keys(STATUT_LABEL) as MembershipStatus[]).map((s) => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
            </select>
            <button className="rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">Filtrer</button>
            {(q || statut) && <Link href="/admin/adhesions" className="text-sm font-semibold text-ink-2 hover:text-primary">Effacer</Link>}
          </form>

          <Card className="mt-4" title={`${fmtNumber(total)} adhésion${total > 1 ? "s" : ""} · page ${page} / ${pages}`}>
            {lignes.length === 0 ? (
              <EmptyState title="Aucune adhésion pour l'instant.">Les paiements FedaPay confirmés et les activations manuelles apparaîtront ici.</EmptyState>
            ) : (
              <TableShell head={<><Th>Membre</Th><Th>Formule</Th><Th>Période</Th><Th>Montant</Th><Th>Statut</Th><Th>&nbsp;</Th></>}>
                {lignes.map((m) => (
                  <tr key={m.id} className="hover:bg-primary-faint">
                    <Td>
                      <p className="font-semibold">
                        {m.user.profile ? <Link href={`/communaute/membres/${m.user.profile.slug}`} className="hover:text-primary hover:underline">{m.user.profile.displayName}</Link> : m.user.email}
                      </p>
                      <p className="text-xs text-muted">{m.user.email}{m.user.profile?.country ? ` · ${m.user.profile.country}` : ""}</p>
                    </Td>
                    <Td className="text-ink-2">
                      {PLAN_LABEL[m.plan]}
                      {m.createdById && <p className="text-xs text-muted">{m.note ?? "Activation manuelle"}</p>}
                      {!m.createdById && m.status === "CANCELLED" && m.note && <p className="text-xs text-muted">{m.note}</p>}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-2">{m.startsAt ? `${fmtDate(m.startsAt)} → ${fmtDate(m.endsAt)}` : fmtDate(m.createdAt)}</Td>
                    <Td className="whitespace-nowrap text-ink-2">
                      {m.paymentRef && m.amount > 0 ? `${fmtNumber(m.amount)} FCFA` : m.displayAmount ?? "—"}
                      {m.paymentRef && <p className="text-xs text-muted">FedaPay n° {m.paymentRef}{m.paymentMode ? ` · ${m.paymentMode}` : ""}</p>}
                    </Td>
                    <Td><Badge tone={STATUT_TONE[m.status]}>{STATUT_LABEL[m.status]}</Badge></Td>
                    <Td>
                      {isAdmin && (m.status === "ACTIVE" || m.status === "PENDING") && (
                        <div className="flex justify-end">
                          <ActionButton action={cancelMembershipAction} fields={{ id: m.id }} label="Retirer" tone="danger" confirm={`Retirer l'adhésion de ${m.user.email} ? Le membre perd le badge et les avantages ; son compte reste actif.`} />
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
              </TableShell>
            )}
            {pages > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-between border-t border-line px-4 py-2.5 text-sm">
                {page > 1 ? <Link href={lien(page - 1)} className="font-bold text-primary hover:underline">← Précédentes</Link> : <span />}
                <span className="text-xs text-muted">{(page - 1) * PAR_PAGE + 1}–{Math.min(page * PAR_PAGE, total)} sur {fmtNumber(total)}</span>
                {page < pages ? <Link href={lien(page + 1)} className="font-bold text-primary hover:underline">Suivantes →</Link> : <span />}
              </nav>
            )}
            <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
              Les montants FedaPay sont en francs CFA (seule devise encaissée) ; le membre a vu le prix dans la devise de son pays. Un renouvellement démarre à la fin de l&apos;adhésion en cours. Les adhésions échues passent automatiquement en « Échue » chaque matin.
            </p>
          </Card>
        </div>

        <Card title="Activer une adhésion à la main">
          {isAdmin ? (
            <ManualMembershipForm />
          ) : (
            <p className="p-4 text-sm text-muted">Réservé aux administrateurs.</p>
          )}
          <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
            Pour un paiement reçu hors ligne (virement, main propre) ou un membre d&apos;honneur. Le membre reçoit un e-mail de confirmation ; l&apos;adhésion court 12 mois (ou prolonge celle en cours).
          </p>
        </Card>
      </div>
    </>
  );
}

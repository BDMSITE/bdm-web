import Link from "next/link";
import type { Metadata } from "next";
import type { MembershipStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { keysPresent } from "@/lib/kkiapay";
import { stripeKeysPresent } from "@/lib/stripe";
import { paiementConfig, PRESTATAIRE_LABEL, type Prestataire } from "@/lib/paiement";
import { adhesionProposee, PLAN_LABEL, RAPPEL_JOURS } from "@/lib/adhesion";
import { cancelMembershipAction } from "@/lib/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { PageHead, StatCard, Card, Badge, TableShell, Th, Td, EmptyState, fmtDate, fmtNumber } from "@/components/admin/ui";
import { ManualMembershipForm } from "./manual-form";

export const metadata: Metadata = { title: "Adhésions HCBE" };

/* Adhésions HCBE (F-156) : adhérents en cours, échéances proches, encaissements KKiaPay,
   activation manuelle (paiement hors ligne, membre d'honneur), retrait, export CSV. */

export const dynamic = "force-dynamic";

const PAR_PAGE = 50;
const STATUT_LABEL: Record<MembershipStatus, string> = { ACTIVE: "En cours", PENDING: "Paiement en attente", EXPIRED: "Échue", CANCELLED: "Annulée / retirée" };
/** Montant stocké : FCFA entiers (KKiaPay) ou centimes (Stripe). */
const montant = (n: number, currency: string) => currency === "XOF" ? `${fmtNumber(n)} FCFA` : `${(n / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${currency === "EUR" ? "€" : currency === "USD" ? "$ US" : currency === "CAD" ? "$ CA" : currency}`;
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

  const [session, proposee, config, actifs, expirant, payeesAnnee, encaisseAnnee, enAttente, total, lignes] = await Promise.all([
    auth(),
    adhesionProposee(),
    paiementConfig(),
    db.membership.count({ where: { status: "ACTIVE", endsAt: { gt: now } } }),
    db.membership.count({ where: { status: "ACTIVE", endsAt: { gt: now, lte: dans30j } } }),
    db.membership.count({ where: { status: "ACTIVE", live: true, paymentRef: { not: null }, amount: { gt: 0 }, startsAt: { gte: debutAnnee } } }),
    db.membership.groupBy({ by: ["currency"], where: { status: { in: ["ACTIVE", "EXPIRED"] }, live: true, paymentRef: { not: null }, startsAt: { gte: debutAnnee } }, _sum: { amount: true } }),
    db.membership.count({ where: { status: "PENDING" } }),
    db.membership.count({ where }),
    db.membership.findMany({
      where,
      orderBy: [{ status: "asc" }, { endsAt: "asc" }, { createdAt: "desc" }],
      take: PAR_PAGE,
      skip: (page - 1) * PAR_PAGE,
      select: { id: true, plan: true, status: true, startsAt: true, endsAt: true, displayAmount: true, amount: true, currency: true, paymentRef: true, paymentMode: true, live: true, provider: true, createdById: true, note: true, createdAt: true, user: { select: { email: true, profile: { select: { displayName: true, slug: true, country: true } } } } },
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
      <PageHead title="Adhésions HCBE" desc="Inscription gratuite pour tous ; adhésion annuelle facultative (20 €, 5 € jeunes et étudiants), payée via KKiaPay ou activée ici à la main. Aucun prélèvement automatique : rappel 30 jours avant l'échéance.">
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
      <div className="mb-4 grid gap-3 text-sm lg:grid-cols-2">
        <p className={`rounded border px-3 py-2.5 ${!config.kkia.ready ? "border-line bg-paper-2" : config.kkia.live ? "border-primary bg-primary-faint" : "border-accent bg-accent-light"}`}>
          <strong>KKiaPay</strong> (zone franc : Mobile Money, carte, wallet, en FCFA) :{" "}
          {!config.kkia.ready ? <>non configuré. Poser <code className="rounded bg-paper px-1">KKIAPAY_SANDBOX_*</code> (publique, privée, secrète) dans Vercel.</> : config.kkia.live ? "mode live, paiements réels." : "mode test (sandbox), paiements simulés."}
          {config.kkia.ready && !config.kkia.webhookReady && " Hash du webhook manquant : un paiement n'est confirmé que si le membre reste sur la page."}
          {config.kkia.ready && !config.kkia.live && !keysPresent("live") && " Clés live absentes."}
        </p>
        <p className={`rounded border px-3 py-2.5 ${!config.stripe.ready ? "border-line bg-paper-2" : config.stripe.live ? "border-primary bg-primary-faint" : "border-accent bg-accent-light"}`}>
          <strong>Stripe</strong> (reste du monde : carte en €, $ US, $ CA) :{" "}
          {!config.stripe.ready ? <>non configuré. Poser <code className="rounded bg-paper px-1">STRIPE_TEST_SECRET_KEY</code> (puis <code className="rounded bg-paper px-1">STRIPE_LIVE_*</code>) dans Vercel ; sans Stripe, les cartes hors zone franc passent par KKiaPay en FCFA.</> : config.stripe.live ? "mode live, paiements réels." : "mode test, paiements simulés."}
          {config.stripe.ready && !config.stripe.webhookReady && " Secret du webhook manquant : un paiement n'est confirmé qu'au retour du membre sur le site."}
          {config.stripe.ready && !config.stripe.live && !stripeKeysPresent("live") && " Clés live absentes."}
        </p>
      </div>
      {!config.enLigne && <p className="mb-4 rounded border border-accent bg-accent-light px-3 py-2.5 text-sm">Paiement en ligne indisponible : les membres sont invités à écrire au HCBE et vous activez ici. La bascule test / réel se fait dans Paramètres → Sécurité &amp; validation.</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Adhérents en cours" value={fmtNumber(actifs)} />
        <StatCard label={`Échéance sous ${RAPPEL_JOURS} jours`} value={fmtNumber(expirant)} tone={expirant ? "warn" : "default"} hint="Rappel envoyé automatiquement par le cron" />
        <StatCard label={`Paiements en ligne ${now.getUTCFullYear()}`} value={fmtNumber(payeesAnnee)} hint={encaisseAnnee.length ? `Encaissé (hors tests) : ${encaisseAnnee.map((e) => montant(e._sum.amount ?? 0, e.currency)).join(" · ")}` : "Rien encaissé pour le moment (hors tests)"} />
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
              <EmptyState title="Aucune adhésion pour l'instant.">Les paiements KKiaPay vérifiés et les activations manuelles apparaîtront ici.</EmptyState>
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
                      {m.paymentRef && m.amount > 0 ? montant(m.amount, m.currency) : m.displayAmount ?? "—"}
                      {m.paymentRef && <p className="text-xs text-muted">{m.provider ? PRESTATAIRE_LABEL[m.provider as Prestataire] : "Paiement"} {m.paymentRef.slice(0, 24)}{m.paymentMode ? ` · ${m.paymentMode}` : ""}{m.live ? "" : " · test"}</p>}
                    </Td>
                    <Td><Badge tone={STATUT_TONE[m.status]}>{STATUT_LABEL[m.status]}</Badge>{m.paymentRef && !m.live && <> <Badge tone="gray">Test</Badge></>}</Td>
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
              KKiaPay encaisse en francs CFA (zone franc) ; Stripe encaisse en €, $ US ou $ CA (reste du monde) au prix affiché au membre. Un renouvellement démarre à la fin de l&apos;adhésion en cours. Les adhésions échues passent automatiquement en « Échue » chaque matin.
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

import Link from "next/link";
import type { Metadata } from "next";
import type { AccountType } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { setUserStatusAction } from "@/lib/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { PageHead, StatCard, Card, Badge, TableShell, Th, Td, EmptyState, UserStatusBadge, fmtDate, fmtNumber } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Communauté" };

/* Communauté : comptes par type (chiffres réels), recherche (nom, e-mail, ville), filtres type / statut,
   pagination par 50, suspension / réactivation. */

const PAR_PAGE = 50;
const STATUTS = ["ACTIVE", "PENDING_EMAIL", "SUSPENDED"] as const;
const STATUT_LABEL: Record<string, string> = { ACTIVE: "Actifs", PENDING_EMAIL: "E-mail non confirmé", SUSPENDED: "Suspendus" };

const TYPE_LABEL: Record<AccountType, string> = {
  MEMBER: "Membres",
  COMPANY: "Entreprises",
  ASSOCIATION: "Associations",
  ARTIST: "Artistes",
};

const TYPE_LABEL_SINGULIER: Record<AccountType, string> = {
  MEMBER: "Membre",
  COMPANY: "Entreprise",
  ASSOCIATION: "Association",
  ARTIST: "Artiste",
};

export default async function AdminCommunautePage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; statut?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const type = (["MEMBER", "COMPANY", "ASSOCIATION", "ARTIST"] as const).find((t) => t === sp.type);
  const statut = STATUTS.find((s) => s === sp.statut);
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const where = {
    status: statut ?? { not: "DELETED" as const },
    ...(type && { accountType: type }),
    ...(q && {
      OR: [
        { email: { contains: q, mode: "insensitive" as const } },
        { name: { contains: q, mode: "insensitive" as const } },
        { profile: { displayName: { contains: q, mode: "insensitive" as const } } },
        { profile: { city: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
  };
  const [session, parType, parTypeActifs, total, derniers] = await Promise.all([
    auth(),
    db.user.groupBy({ by: ["accountType"], where: { status: { not: "DELETED" } }, _count: { _all: true } }),
    db.user.groupBy({ by: ["accountType"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAR_PAGE,
      skip: (page - 1) * PAR_PAGE,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        accountType: true,
        status: true,
        importedFrom: true,
        createdAt: true,
        profile: { select: { displayName: true, slug: true, city: true, country: true } },
      },
    }),
  ]);

  const count = (rows: typeof parType, t: AccountType) => rows.find((r) => r.accountType === t)?._count._all ?? 0;
  const types: AccountType[] = ["MEMBER", "COMPANY", "ASSOCIATION", "ARTIST"];
  const pages = Math.max(1, Math.ceil(total / PAR_PAGE));
  const lien = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (type) u.set("type", type);
    if (statut) u.set("statut", statut);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/communaute${s ? `?${s}` : ""}`;
  };
  const INPUT = "rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

  return (
    <>
      <PageHead title="Communauté" desc="Tous les comptes du portail (membres, entreprises, associations, artistes), hors comptes supprimés.">
        <a href="/api/admin/export/annuaire" className="whitespace-nowrap rounded border border-line bg-paper px-4 py-2 text-sm font-bold text-ink-2 hover:border-primary hover:text-primary">
          Exporter l&apos;annuaire (CSV)
        </a>
        <Link href="/admin/imports" className="whitespace-nowrap rounded border border-line bg-paper px-4 py-2 text-sm font-bold text-ink-2 hover:border-primary hover:text-primary">
          Imports de membres
        </Link>
      </PageHead>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {types.map((t) => (
          <StatCard key={t} label={TYPE_LABEL[t]} value={fmtNumber(count(parType, t))} hint={`${fmtNumber(count(parTypeActifs, t))} actif${count(parTypeActifs, t) > 1 ? "s" : ""} (e-mail confirmé)`} />
        ))}
      </div>

      <form action="/admin/communaute" className="mt-6 flex flex-wrap items-center gap-2">
        <input type="search" name="q" defaultValue={q} aria-label="Rechercher un compte" placeholder="Nom, e-mail, ville…" className={`${INPUT} w-full sm:w-72`} />
        <select name="type" defaultValue={type ?? ""} aria-label="Type de compte" className={INPUT}>
          <option value="">Tous les types</option>
          {types.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
        <select name="statut" defaultValue={statut ?? ""} aria-label="Statut" className={INPUT}>
          <option value="">Tous les statuts (hors supprimés)</option>
          {STATUTS.map((s) => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
        </select>
        <button className="rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">Rechercher</button>
        {(q || type || statut) && <Link href="/admin/communaute" className="text-sm font-semibold text-ink-2 hover:text-primary">Effacer</Link>}
      </form>

      <Card className="mt-4" title={`${fmtNumber(total)} compte${total > 1 ? "s" : ""}${q ? ` pour « ${q} »` : ""} · page ${page} / ${pages}`}>
        {derniers.length === 0 ? (
          <EmptyState title="Aucun compte ne correspond." />
        ) : (
          <TableShell head={<><Th>Compte</Th><Th>Type</Th><Th>Lieu</Th><Th>Inscrit le</Th><Th>Statut</Th><Th>&nbsp;</Th></>}>
            {derniers.map((u) => (
              <tr key={u.id} className="hover:bg-primary-faint">
                <Td>
                  <p className="font-semibold">
                    {u.profile ? (
                      <Link href={`/communaute/membres/${u.profile.slug}`} className="hover:text-primary hover:underline">{u.profile.displayName}</Link>
                    ) : (
                      u.name ?? "—"
                    )}
                    {u.role !== "USER" && <Badge tone="gray">{u.role === "ADMIN" ? "Admin" : u.role === "MODERATOR" ? "Modération" : u.role === "REGIE" ? "Régie" : "Rédaction"}</Badge>}
                  </p>
                  <p className="text-xs text-muted">{u.email}{u.importedFrom ? ` · importé (${u.importedFrom})` : ""}</p>
                </Td>
                <Td className="text-ink-2">{TYPE_LABEL_SINGULIER[u.accountType]}</Td>
                <Td className="whitespace-nowrap text-ink-2">{[u.profile?.city, u.profile?.country].filter(Boolean).join(", ") || "—"}</Td>
                <Td className="whitespace-nowrap text-muted">{fmtDate(u.createdAt)}</Td>
                <Td><UserStatusBadge status={u.status} /></Td>
                <Td>
                  <div className="flex flex-nowrap justify-end gap-2">
                    {u.id === session?.user?.id ? (
                      <span className="text-xs text-muted">vous</span>
                    ) : u.status === "SUSPENDED" ? (
                      <ActionButton action={setUserStatusAction} fields={{ id: u.id, status: "ACTIVE" }} label="Réactiver" tone="primary" />
                    ) : u.status === "ACTIVE" ? (
                      <ActionButton action={setUserStatusAction} fields={{ id: u.id, status: "SUSPENDED" }} label="Suspendre" tone="danger" confirm={`Suspendre le compte ${u.email} ?`} />
                    ) : null}
                  </div>
                </Td>
              </tr>
            ))}
          </TableShell>
        )}
        {pages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between border-t border-line px-4 py-2.5 text-sm">
            {page > 1 ? <Link href={lien(page - 1)} className="font-bold text-primary hover:underline">← Précédents</Link> : <span />}
            <span className="text-xs text-muted">{(page - 1) * PAR_PAGE + 1}–{Math.min(page * PAR_PAGE, total)} sur {fmtNumber(total)}</span>
            {page < pages ? <Link href={lien(page + 1)} className="font-bold text-primary hover:underline">Suivants →</Link> : <span />}
          </nav>
        )}
        <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
          Un compte suspendu ne peut plus se connecter (effectif en 5 minutes) ; ses contenus restent visibles. Il n&apos;existe pas encore de validation manuelle des comptes
          professionnels : un compte entreprise, association ou artiste est actif dès que son e-mail est confirmé.
        </p>
      </Card>
    </>
  );
}

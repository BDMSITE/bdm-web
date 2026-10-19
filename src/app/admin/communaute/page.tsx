import Link from "next/link";
import type { Metadata } from "next";
import type { AccountType } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { setUserStatusAction } from "@/lib/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { PageHead, StatCard, Card, Badge, TableShell, Th, Td, EmptyState, UserStatusBadge, fmtDate, fmtNumber } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Communauté" };

/* Communauté : comptes par type (chiffres réels), 50 derniers inscrits, suspension / réactivation. */

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

export default async function AdminCommunautePage() {
  const [session, parType, parTypeActifs, derniers] = await Promise.all([
    auth(),
    db.user.groupBy({ by: ["accountType"], where: { status: { not: "DELETED" } }, _count: { _all: true } }),
    db.user.groupBy({ by: ["accountType"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    db.user.findMany({
      where: { status: { not: "DELETED" } },
      orderBy: { createdAt: "desc" },
      take: 50,
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

  return (
    <>
      <PageHead title="Communauté" desc="Tous les comptes du portail (membres, entreprises, associations, artistes), hors comptes supprimés.">
        <Link href="/admin/imports" className="whitespace-nowrap rounded border border-line bg-paper px-4 py-2 text-sm font-bold text-ink-2 hover:border-primary hover:text-primary">
          Imports de membres
        </Link>
      </PageHead>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {types.map((t) => (
          <StatCard key={t} label={TYPE_LABEL[t]} value={fmtNumber(count(parType, t))} hint={`${fmtNumber(count(parTypeActifs, t))} actif${count(parTypeActifs, t) > 1 ? "s" : ""} (e-mail confirmé)`} />
        ))}
      </div>

      <Card className="mt-6" title="50 derniers comptes créés">
        {derniers.length === 0 ? (
          <EmptyState title="Aucun compte pour l'instant." />
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
                    {u.role !== "USER" && <Badge tone="gray">{u.role === "ADMIN" ? "Admin" : u.role === "MODERATOR" ? "Modération" : "Rédaction"}</Badge>}
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
        <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
          Un compte suspendu ne peut plus se connecter ; ses contenus restent visibles. Il n&apos;existe pas encore de validation manuelle des comptes
          professionnels : un compte entreprise, association ou artiste est actif dès que son e-mail est confirmé.
        </p>
      </Card>
    </>
  );
}

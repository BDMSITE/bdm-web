import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { setExpertStatusAction } from "@/lib/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { EXPERT_MODE_LABEL, expertModes } from "@/lib/competences";
import { PageHead, StatCard, Card, Badge, TableShell, Th, Td, EmptyState, fmtDate, fmtNumber } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Compétences" };

/* Compétences de la diaspora : propositions des membres (domaine, modes, texte),
   validation ou refus par l'équipe, liste des experts publiés. Les mises en relation
   passent par la messagerie relais du profil (comptées sur 30 jours). */

export default async function AdminCompetencesPage() {
  const depuis30j = new Date(new Date().getTime() - 30 * 864e5);
  const select = { id: true, slug: true, displayName: true, city: true, country: true, expertDomain: true, expertModes: true, expertPitch: true, expertAt: true, user: { select: { email: true } } };
  const [pending, approved, rejected, contacts] = await Promise.all([
    db.profile.findMany({ where: { expertStatus: "PENDING" }, orderBy: { expertAt: "asc" }, select }),
    db.profile.findMany({ where: { expertStatus: "APPROVED" }, orderBy: { expertAt: "desc" }, take: 200, select }),
    db.profile.count({ where: { expertStatus: "REJECTED" } }),
    db.message.count({ where: { createdAt: { gte: depuis30j }, to: { expertStatus: "APPROVED" } } }),
  ]);

  return (
    <>
      <PageHead title="Compétences de la diaspora" desc="Mentorat, missions courtes, conseil à distance : chaque proposition est relue avant d'apparaître sur le site.">
        <Link href="/communaute/competences" className="whitespace-nowrap rounded border-2 border-primary px-4 py-1.5 text-sm font-bold text-primary hover:bg-primary hover:text-white">
          Voir la page publique
        </Link>
      </PageHead>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="À relire" value={fmtNumber(pending.length)} tone={pending.length ? "warn" : "default"} />
        <StatCard label="Experts publiés" value={fmtNumber(approved.length)} />
        <StatCard label="Non retenus" value={fmtNumber(rejected)} />
        <StatCard label="Messages reçus 30 j" value={fmtNumber(contacts)} hint="via la messagerie relais" />
      </div>

      <Card className="mt-6" title={`Propositions à relire (${pending.length})`}>
        {pending.length === 0 ? (
          <EmptyState title="Rien à relire.">Les membres proposent leurs compétences depuis leur espace (Mes compétences pour le Bénin).</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((p) => (
              <li key={p.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="text-sm">
                  <p className="font-bold">
                    <Link href={`/communaute/membres/${p.slug}`} className="hover:underline">{p.displayName}</Link>
                    <span className="ml-2 font-normal text-muted">{[p.city, p.country].filter(Boolean).join(", ")}</span>
                  </p>
                  <p className="mt-1">
                    <Badge tone="blue">{p.expertDomain ?? "Domaine ?"}</Badge>{" "}
                    {expertModes(p.expertModes).map((m) => <Badge key={m} tone="gray">{EXPERT_MODE_LABEL[m]}</Badge>)}
                    <span className="ml-2 text-xs text-muted">proposé le {p.expertAt ? fmtDate(p.expertAt) : "—"}</span>
                  </p>
                  <p className="mt-2 whitespace-pre-line text-ink-2">{p.expertPitch}</p>
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  <ActionButton action={setExpertStatusAction} fields={{ id: p.id, decision: "approve" }} label="Valider" tone="primary" />
                  <ActionButton action={setExpertStatusAction} fields={{ id: p.id, decision: "reject" }} label="Refuser" tone="danger" confirm={`Refuser la proposition de ${p.displayName} ?`} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6" title={`Experts publiés (${approved.length})`}>
        {approved.length === 0 ? (
          <EmptyState title="Aucun expert publié pour l'instant." />
        ) : (
          <TableShell head={<><Th>Membre</Th><Th>Domaine</Th><Th>Modes</Th><Th>Lieu</Th><Th>Validé le</Th><Th>Action</Th></>}>
            {approved.map((p) => (
              <tr key={p.id} className="hover:bg-primary-faint">
                <Td className="font-semibold"><Link href={`/communaute/membres/${p.slug}`} className="hover:underline">{p.displayName}</Link></Td>
                <Td>{p.expertDomain}</Td>
                <Td className="text-ink-2">{expertModes(p.expertModes).map((m) => EXPERT_MODE_LABEL[m]).join(", ")}</Td>
                <Td className="text-ink-2">{[p.city, p.country].filter(Boolean).join(", ") || "—"}</Td>
                <Td className="whitespace-nowrap text-muted">{p.expertAt ? fmtDate(p.expertAt) : "—"}</Td>
                <Td><ActionButton action={setExpertStatusAction} fields={{ id: p.id, decision: "reject" }} label="Retirer" tone="neutral" confirm={`Retirer ${p.displayName} de la rubrique ?`} /></Td>
              </tr>
            ))}
          </TableShell>
        )}
      </Card>
    </>
  );
}

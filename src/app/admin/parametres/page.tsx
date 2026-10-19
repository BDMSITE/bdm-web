import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHead, Card, Badge, TableShell, Th, Td } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Paramètres" };

/* Paramètres : état des services (sans exposer de secret), équipe d'administration, liens utiles.
   Les quotas et textes d'e-mails ne sont pas encore configurables depuis le back-office. */

export const dynamic = "force-dynamic";

function Etat({ ok, oui, non }: { ok: boolean; oui: string; non: string }) {
  return ok ? <Badge tone="green">{oui}</Badge> : <Badge tone="yellow">{non}</Badge>;
}

export default async function AdminParametresPage() {
  const env = process.env;
  const mail = env.BREVO_API_KEY ? "Brevo" : env.RESEND_API_KEY ? "Resend" : null;

  let baseOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    baseOk = true;
  } catch {
    baseOk = false;
  }

  const equipe = await db.user.findMany({
    where: { role: { in: ["EDITOR", "MODERATOR", "ADMIN"] }, status: { not: "DELETED" } },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, status: true, twoFactorSecret: true },
  });

  const services = [
    { l: "Base de données (Postgres)", etat: <Etat ok={baseOk} oui="Connectée" non="Injoignable" />, note: baseOk ? "Prisma répond." : "Vérifier DATABASE_URL." },
    { l: "E-mails transactionnels", etat: <Etat ok={!!mail} oui={`Configuré (${mail})`} non="Non configuré" />, note: mail ? `Expéditeur : ${env.EMAIL_FROM ?? "non défini"}` : "Sans clé, les e-mails s'affichent dans les logs du serveur." },
    { l: "Recherche", etat: <Etat ok={!!env.MEILI_HOST} oui="Meilisearch" non="Repli Postgres" />, note: env.MEILI_HOST ? "Tolérance aux fautes et facettes." : "Recherche par mots exacts (ILIKE), mêmes pages." },
    { l: "Cartes (MapTiler)", etat: <Etat ok={!!env.NEXT_PUBLIC_MAPTILER_KEY} oui="Configuré" non="Non configuré" />, note: env.NEXT_PUBLIC_MAPTILER_KEY ? "" : "Fond de carte OpenStreetMap par défaut." },
    { l: "Paiements (FedaPay)", etat: <Etat ok={!!env.FEDAPAY_SECRET_KEY} oui="Configuré" non="Non configuré" />, note: "Monétisation prévue en S6." },
    { l: "Authentification", etat: <Etat ok={!!env.AUTH_SECRET && env.AUTH_SECRET !== "change-me"} oui="Secret défini" non="Secret à définir" />, note: "Sessions JWT, mot de passe + lien magique." },
  ];

  const ROLE: Record<string, { l: string; tone: "green" | "blue" | "gray" }> = {
    ADMIN: { l: "Administrateur", tone: "green" },
    MODERATOR: { l: "Modération", tone: "blue" },
    EDITOR: { l: "Rédaction", tone: "blue" },
  };

  return (
    <>
      <PageHead title="Paramètres" desc="État des services branchés au site et équipe d'administration. Aucune clé n'est affichée." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Services">
          <ul className="divide-y divide-line text-sm">
            {services.map((s) => (
              <li key={s.l} className="flex items-center justify-between gap-4 px-4 py-3">
                <span>
                  <span className="block font-semibold">{s.l}</span>
                  {s.note && <span className="block text-xs text-muted">{s.note}</span>}
                </span>
                {s.etat}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Liens utiles">
          <ul className="divide-y divide-line text-sm">
            {[
              { l: "Site public", href: "/" },
              { l: "Page de connexion", href: "/connexion" },
              { l: "Imports de membres (invitations)", href: "/admin/imports" },
              { l: "Journal d'activité", href: "/admin/journal" },
              { l: "Mentions légales", href: "/legal/mentions-legales" },
            ].map((x) => (
              <li key={x.href} className="px-4 py-3">
                <Link href={x.href} className="font-semibold text-primary hover:underline">{x.l}</Link>
                <span className="ml-2 text-xs text-muted">{x.href}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
            Les variables d&apos;environnement se gèrent dans Vercel (Settings → Environment Variables) ou dans le fichier <code className="rounded bg-paper-2 px-1">.env</code> en local.
          </p>
        </Card>
      </div>

      <Card className="mt-6" title={`Équipe d'administration (${equipe.length})`}>
        <TableShell head={<><Th>Personne</Th><Th>E-mail</Th><Th>Rôle</Th><Th>Compte</Th><Th>2FA</Th></>}>
          {equipe.map((u) => (
            <tr key={u.id} className="hover:bg-primary-faint">
              <Td className="font-semibold">{u.name ?? "—"}</Td>
              <Td className="text-ink-2">{u.email}</Td>
              <Td><Badge tone={ROLE[u.role]?.tone ?? "gray"}>{ROLE[u.role]?.l ?? u.role}</Badge></Td>
              <Td className="text-ink-2">{u.status === "ACTIVE" ? "Actif" : u.status === "SUSPENDED" ? "Suspendu" : "E-mail à confirmer"}</Td>
              <Td>{u.twoFactorSecret ? <Badge tone="green">Activée</Badge> : <Badge tone="gray">Non activée</Badge>}</Td>
            </tr>
          ))}
        </TableShell>
        <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
          L&apos;attribution des rôles et l&apos;activation de la 2FA (obligatoire pour l&apos;équipe, CDC §10.3) ne sont pas encore disponibles depuis cette page.
        </p>
      </Card>
    </>
  );
}

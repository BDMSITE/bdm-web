import { Prisma } from "@prisma/client";
import { db } from "./db";
import { sendNewsletter } from "./mail";
import { signToken, verifyToken } from "./signed-token";
import { contentHref, CONTENT_LABEL } from "./routes";
import { SITE_URL } from "./site-url";

/* Newsletter : abonnés (double confirmation), numéros composés dans l'admin,
   envoi par lots via Brevo (300 e-mails/jour sur l'offre gratuite). Un numéro
   dont l'envoi est entamé se termine seul : le cron du matin reprend là où il
   s'est arrêté (curseur = dernier e-mail servi, ordre alphabétique). */

export type IssueStats = { sent: number; lastEmail: string | null; done: boolean; total?: number; startedAt?: string; finishedAt?: string };

export function confirmLink(email: string) {
  return `${SITE_URL}/newsletter/confirmer?jeton=${signToken({ purpose: "nl-confirm", email }, 7 * 86400)}`;
}
export function unsubscribeLink(email: string) {
  return `${SITE_URL}/newsletter/desinscription?jeton=${signToken({ purpose: "nl-unsub", email }, 365 * 86400)}`;
}
export function readEmailToken(token: string | undefined, purpose: "nl-confirm" | "nl-unsub") {
  return verifyToken<{ email: string }>(token, purpose)?.email ?? null;
}

export function issueStats(raw: unknown): IssueStats {
  const s = (raw ?? {}) as Partial<IssueStats>;
  return { sent: s.sent ?? 0, lastEmail: s.lastEmail ?? null, done: s.done ?? false, total: s.total, startedAt: s.startedAt, finishedAt: s.finishedAt };
}

/* Destinataires : abonnés dont l'adresse est confirmée (double opt-in) ou qui ont un compte membre
   actif (l'activation du compte vaut confirmation). Jointure SQL : Subscriber et User ne sont pas liés. */
const RECIPIENT_FILTER = Prisma.sql`(s."confirmedAt" IS NOT NULL OR u.status = 'ACTIVE')`;

/** Nombre d'abonnés qui recevront la lettre. */
export async function countRecipients() {
  const rows = await db.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*)::bigint AS n FROM "Subscriber" s LEFT JOIN "User" u ON u.email = s.email WHERE ${RECIPIENT_FILTER}`;
  return Number(rows[0]?.n ?? 0);
}

/** E-mails destinataires après un curseur, par ordre alphabétique. */
async function recipients(after: string | null, limit: number) {
  const rows = await db.$queryRaw<{ email: string }[]>`SELECT s.email FROM "Subscriber" s LEFT JOIN "User" u ON u.email = s.email
    WHERE ${RECIPIENT_FILTER} AND (${after}::text IS NULL OR s.email > ${after}) ORDER BY s.email ASC LIMIT ${limit}`;
  return rows.map((r) => r.email);
}

/** Contenu d'un numéro prêt à être envoyé. */
export async function issuePayload(issueId: string) {
  const issue = await db.newsletterIssue.findUnique({ where: { id: issueId } });
  if (!issue) return null;
  const ids = Array.isArray(issue.contentIds) ? (issue.contentIds as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const intro = issue.intro ?? "";
  const contents = ids.length
    ? await db.content.findMany({ where: { id: { in: ids }, status: "PUBLISHED" }, select: { id: true, title: true, slug: true, type: true, excerpt: true, city: true, country: true } })
    : [];
  const byId = new Map(contents.map((c) => [c.id, c]));
  const items = ids.flatMap((id) => {
    const c = byId.get(id);
    return c ? [{ title: c.title, href: `${SITE_URL}${contentHref(c.type, c.slug)}`, label: CONTENT_LABEL[c.type], excerpt: c.excerpt ?? "", place: [c.city, c.country].filter(Boolean).join(", ") }] : [];
  });
  return { issue, intro, items };
}

/** Envoie jusqu'à `limit` e-mails d'un numéro et avance le curseur. */
export async function sendNewsletterBatch(issueId: string, limit: number): Promise<{ sent: number; done: boolean; error?: string }> {
  if (limit <= 0) return { sent: 0, done: false };
  const payload = await issuePayload(issueId);
  if (!payload) return { sent: 0, done: false, error: "Numéro introuvable." };
  const { issue, intro, items } = payload;
  const stats = issueStats(issue.stats);
  if (stats.done) return { sent: 0, done: true };

  const emails = await recipients(stats.lastEmail, limit);
  let sent = 0;
  for (const email of emails) {
    try {
      await sendNewsletter(email, { subject: issue.subject, intro, items }, unsubscribeLink(email));
      sent++;
      stats.lastEmail = email;
      stats.sent++;
    } catch (e) {
      console.error("[newsletter] envoi impossible", email, e);
      break;
    }
  }
  const done = emails.length < limit && sent === emails.length;
  await db.newsletterIssue.update({
    where: { id: issueId },
    data: {
      sentAt: issue.sentAt ?? new Date(),
      stats: { sent: stats.sent, lastEmail: stats.lastEmail, done, startedAt: stats.startedAt ?? new Date().toISOString(), finishedAt: done ? new Date().toISOString() : undefined, total: stats.total },
    },
  });
  return { sent, done };
}

/** Numéros dont l'envoi est entamé mais pas terminé (repris par le cron). */
export async function pendingIssues() {
  const issues = await db.newsletterIssue.findMany({ where: { sentAt: { not: null } }, orderBy: { sentAt: "asc" } });
  return issues.filter((i) => !issueStats(i.stats).done);
}

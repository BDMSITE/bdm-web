import { NextResponse } from "next/server";
import type { ContentType } from "@prisma/client";
import { db } from "@/lib/db";
import { sendAlertDigest } from "@/lib/mail";
import { contentHref, CONTENT_LABEL } from "@/lib/routes";
import { SITE_URL as BASE } from "@/lib/site-url";
import { numberSetting } from "@/lib/settings";
import { pendingIssues, sendNewsletterBatch } from "@/lib/newsletter";
import { weeklyDigest, profileReminders, monthlyRegieReport } from "@/lib/rappels";

/* Alertes par mots-clés : chaque matin (cron Vercel), pour chaque alerte,
   les contenus publiés depuis le dernier envoi qui portent un de ses mots-clés
   et sont d'un type suivi. Un e-mail par membre, rien s'il n'y a rien. */

export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const alerts = await db.alert.findMany({ include: { user: { select: { email: true, status: true, name: true } } } });
  let envoyes = 0, sansNouveaute = 0;
  const now = new Date();
  const parMembre = new Map<string, { email: string; items: { title: string; href: string; label: string }[]; alertIds: string[] }>();

  for (const a of alerts) {
    if (a.user.status !== "ACTIVE") continue;
    const since = a.lastSentAt ?? a.createdAt;
    const keywordIds = (a.keywordIds as string[]) ?? [];
    const types = ((a.contentTypes as string[]) ?? []) as ContentType[];
    if (!keywordIds.length || !types.length) continue;
    const contents = await db.content.findMany({
      where: { status: "PUBLISHED", publishedAt: { gt: since }, type: { in: types }, keywords: { some: { keywordId: { in: keywordIds } } } },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: { title: true, slug: true, type: true },
    });
    const entry = parMembre.get(a.userId) ?? { email: a.user.email, items: [], alertIds: [] };
    entry.alertIds.push(a.id);
    for (const c of contents) {
      const href = `${BASE}${contentHref(c.type, c.slug)}`;
      if (!entry.items.some((i) => i.href === href)) entry.items.push({ title: c.title, href, label: CONTENT_LABEL[c.type] });
    }
    parMembre.set(a.userId, entry);
  }

  for (const [, m] of parMembre) {
    if (m.items.length === 0) { sansNouveaute++; continue; }
    try {
      await sendAlertDigest(m.email, m.items, `${BASE}/compte/alertes`);
      await db.alert.updateMany({ where: { id: { in: m.alertIds } }, data: { lastSentAt: now } });
      envoyes++;
    } catch (e) {
      console.error("[alertes] envoi impossible", m.email, e);
    }
  }
  console.info(`[alertes] ${alerts.length} alertes, ${envoyes} e-mails envoyés, ${sansNouveaute} membres sans nouveauté`);

  /* Newsletter : les numéros dont l'envoi est entamé continuent dans la limite journalière. */
  let budget = (await numberSetting("quota.mails.jour")) - envoyes;
  let newsletter = 0;
  for (const issue of await pendingIssues()) {
    if (budget <= 0) break;
    const r = await sendNewsletterBatch(issue.id, budget);
    newsletter += r.sent;
    budget -= r.sent;
    if (r.error || !r.done) break;
  }
  if (newsletter) console.info(`[newsletter] ${newsletter} e-mails envoyés par le cron`);

  /* Lundi : hebdo « près de chez vous » puis rappels de profil ; 1er du mois : rapport régie. */
  let hebdo = 0, rappels = 0, rapport = false;
  if (now.getUTCDay() === 1) {
    hebdo = await weeklyDigest(budget);
    budget -= hebdo;
    rappels = await profileReminders(Math.min(budget, 50));
    budget -= rappels;
  }
  if (now.getUTCDate() === 1) rapport = await monthlyRegieReport().catch((e) => { console.error("[régie] rapport impossible", e); return false; });
  return NextResponse.json({ ok: true, alertes: alerts.length, envoyes, sansNouveaute, newsletter, hebdo, rappels, rapport });
}

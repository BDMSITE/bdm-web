import { db } from "./db";
import { sendProfileReminder, sendWeeklyDigest, sendMonthlyReport, sendEventReminder, sendMembershipReminder } from "./mail";
import { RAPPEL_JOURS, fmtEcheance, tarifs, deviseDuPays } from "./adhesion";
import { contentHref, CONTENT_LABEL } from "./routes";
import { SITE_URL } from "./site-url";
import { unsubscribeLink } from "./newsletter";

/* E-mails périodiques lancés par le cron du matin (dans la limite journalière) :
   - lundi : « nouveautés près de chez vous » aux abonnés de la lettre qui ont un pays
     dans leur profil (7 derniers jours, même pays) ;
   - lundi : rappel unique aux membres actifs depuis plus de 7 jours dont le profil
     n'a ni ville ni bio (trace dans le journal pour ne jamais relancer deux fois) ;
   - 1er du mois : rapport de la régie (mois précédent) à l'adresse de contact. */

export async function weeklyDigest(budget: number): Promise<number> {
  if (budget <= 0) return 0;
  const depuis = new Date(Date.now() - 7 * 864e5);
  const abonnes = await db.$queryRaw<{ email: string; country: string; displayName: string }[]>`
    SELECT u.email, p.country, p."displayName" FROM "User" u
    JOIN "Profile" p ON p."userId" = u.id
    JOIN "Subscriber" s ON s.email = u.email
    WHERE u.status = 'ACTIVE' AND p.country IS NOT NULL AND p.country <> ''
    ORDER BY u.email ASC LIMIT ${budget}`;
  if (abonnes.length === 0) return 0;
  const pays = [...new Set(abonnes.map((a) => a.country))];
  const contenus = await db.content.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: depuis }, country: { in: pays } },
    orderBy: { publishedAt: "desc" },
    select: { title: true, slug: true, type: true, country: true, city: true },
  });
  const parPays = new Map<string, typeof contenus>();
  for (const c of contenus) {
    const list = parPays.get(c.country ?? "") ?? [];
    if (list.length < 12) list.push(c);
    parPays.set(c.country ?? "", list);
  }
  let sent = 0;
  for (const a of abonnes) {
    const items = parPays.get(a.country) ?? [];
    if (items.length === 0) continue;
    try {
      await sendWeeklyDigest(
        a.email,
        a.country,
        items.map((c) => ({ title: c.title, href: `${SITE_URL}${contentHref(c.type, c.slug)}`, label: CONTENT_LABEL[c.type], place: c.city ?? "" })),
        unsubscribeLink(a.email),
      );
      sent++;
    } catch (e) {
      console.error("[hebdo] envoi impossible", a.email, e);
    }
  }
  return sent;
}

export async function profileReminders(budget: number): Promise<number> {
  if (budget <= 0) return 0;
  const avant = new Date(Date.now() - 7 * 864e5);
  const candidats = await db.user.findMany({
    where: {
      status: "ACTIVE",
      createdAt: { lt: avant },
      profile: { OR: [{ city: null }, { city: "" }, { bio: null }, { bio: "" }] },
    },
    select: { id: true, email: true, profile: { select: { displayName: true } } },
    orderBy: { createdAt: "asc" },
    take: budget * 2,
  });
  if (candidats.length === 0) return 0;
  const deja = new Set(
    (await db.auditLog.findMany({ where: { action: "reminder.profile", entityId: { in: candidats.map((c) => c.id) } }, select: { entityId: true } })).map((a) => a.entityId),
  );
  let sent = 0;
  for (const c of candidats) {
    if (sent >= budget) break;
    if (deja.has(c.id)) continue;
    try {
      await sendProfileReminder(c.email, c.profile?.displayName ?? "", `${SITE_URL}/compte/profil`);
      await db.auditLog.create({ data: { userId: c.id, action: "reminder.profile", entity: "User", entityId: c.id } });
      sent++;
    } catch (e) {
      console.error("[rappel profil] envoi impossible", c.email, e);
    }
  }
  return sent;
}

export async function monthlyHcbeReport(): Promise<boolean> {
  const to = process.env.CONTACT_EMAIL ?? process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1];
  if (!to) return false;
  const now = new Date();
  const debut = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const fin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const mois = debut.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
  const periode = { gte: debut, lt: fin };
  const [inscrits, actifs, pays, publications, messages, candidatures, abonnes, experts, stats] = await Promise.all([
    db.user.count({ where: { status: "ACTIVE", emailVerified: periode } }),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.profile.findMany({ where: { user: { status: "ACTIVE" }, country: { not: null } }, distinct: ["country"], select: { country: true } }).then((r) => r.length),
    db.content.count({ where: { status: "PUBLISHED", publishedAt: periode } }),
    db.message.count({ where: { createdAt: periode } }),
    db.application.count({ where: { createdAt: periode } }),
    db.subscriber.count({ where: { confirmedAt: { not: null } } }),
    db.profile.count({ where: { expertStatus: "APPROVED" } }),
    db.bannerStat.groupBy({ by: ["bannerId"], where: { day: periode }, _sum: { impressions: true, clicks: true } }),
  ]);
  const banners = stats.length ? await db.banner.findMany({ where: { id: { in: stats.map((s) => s.bannerId) } }, select: { id: true, title: true, advertiser: true } }) : [];
  const byId = new Map(banners.map((b) => [b.id, b]));
  const regie = stats
    .map((s) => ({ advertiser: byId.get(s.bannerId)?.advertiser ?? "?", title: byId.get(s.bannerId)?.title ?? s.bannerId, impressions: s._sum.impressions ?? 0, clicks: s._sum.clicks ?? 0 }))
    .sort((a, b) => b.impressions - a.impressions);
  await sendMonthlyReport(to, mois, { inscrits, actifs, pays, publications, messages, candidatures, abonnes, experts }, regie, `${SITE_URL}/admin`);
  return true;
}

/** Rappel aux participants des événements qui ont lieu dans 24 à 48 h (cron quotidien : un seul envoi par événement). */
export async function eventReminders(budget: number): Promise<number> {
  if (budget <= 0) return 0;
  const now = Date.now();
  const events = await db.content.findMany({
    where: { type: "EVENT", status: "PUBLISHED", event: { startsAt: { gte: new Date(now + 24 * 3600e3), lt: new Date(now + 48 * 3600e3) } } },
    include: { event: true, rsvps: { include: { user: { select: { email: true, status: true, profile: { select: { displayName: true } } } } } } },
  });
  let sent = 0;
  for (const e of events) {
    for (const r of e.rsvps) {
      if (sent >= budget) return sent;
      if (r.user.status !== "ACTIVE" || !e.event) continue;
      try {
        await sendEventReminder(r.user.email, {
          title: e.title,
          href: `${SITE_URL}${contentHref(e.type, e.slug)}`,
          startsAt: e.event.startsAt,
          timezone: e.event.timezone,
          place: e.event.isOnline ? "En ligne" : [e.event.venue, e.city, e.country].filter(Boolean).join(", "),
          prenom: r.user.profile?.displayName.split(" ")[0] ?? "",
        });
        sent++;
      } catch (err) {
        console.error("[rappel événement] envoi impossible", r.user.email, err);
      }
    }
  }
  return sent;
}

/* ---------- Adhésions HCBE ---------- */

/** Chaque matin : adhésions échues → EXPIRED ; tentatives de paiement en attente depuis plus de 2 jours → CANCELLED. */
export async function expireMemberships(): Promise<number> {
  const now = new Date();
  const [echues] = await Promise.all([
    db.membership.updateMany({ where: { status: "ACTIVE", endsAt: { lte: now } }, data: { status: "EXPIRED" } }),
    db.membership.updateMany({ where: { status: "PENDING", createdAt: { lt: new Date(now.getTime() - 2 * 864e5) } }, data: { status: "CANCELLED", note: "Paiement jamais finalisé" } }),
  ]);
  return echues.count;
}

/** Rappel unique 30 jours avant l'échéance (décision HCBE : aucun prélèvement automatique). */
export async function membershipReminders(budget: number): Promise<number> {
  if (budget <= 0) return 0;
  const limite = new Date(Date.now() + RAPPEL_JOURS * 864e5);
  const aRappeler = await db.membership.findMany({
    where: { status: "ACTIVE", reminderSentAt: null, endsAt: { gt: new Date(), lte: limite }, user: { status: "ACTIVE" } },
    orderBy: { endsAt: "asc" },
    take: budget,
    select: { id: true, plan: true, endsAt: true, user: { select: { id: true, email: true, profile: { select: { displayName: true, country: true } } } } },
  });
  let sent = 0;
  for (const m of aRappeler) {
    /* Déjà renouvelée (une autre adhésion démarre après celle-ci) : pas de rappel. */
    const suivante = await db.membership.findFirst({ where: { userId: m.user.id, status: "ACTIVE", id: { not: m.id }, startsAt: { gte: m.endsAt ?? undefined } }, select: { id: true } });
    if (suivante) {
      await db.membership.update({ where: { id: m.id }, data: { reminderSentAt: new Date() } });
      continue;
    }
    try {
      const prix = await tarifs(deviseDuPays(m.user.profile?.country));
      const tarif = prix.find((t) => t.plan === (m.plan === "ETUDIANT" ? "ETUDIANT" : "ANNUEL")) ?? prix[0];
      await sendMembershipReminder(m.user.email, { prenom: (m.user.profile?.displayName ?? "").split(" ")[0] || "cher membre", echeance: fmtEcheance(m.endsAt), montant: tarif.affiche, href: `${SITE_URL}/compte/adhesion` });
      await db.membership.update({ where: { id: m.id }, data: { reminderSentAt: new Date() } });
      await db.auditLog.create({ data: { userId: m.user.id, action: "membership.reminder", entity: "Membership", entityId: m.id } });
      sent++;
    } catch (e) {
      console.error("[adhesion] rappel impossible", m.user.email, e);
    }
  }
  return sent;
}

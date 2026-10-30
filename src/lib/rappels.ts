import { db } from "./db";
import { sendProfileReminder, sendWeeklyDigest, sendRegieReport } from "./mail";
import { contentHref, CONTENT_LABEL } from "./routes";
import { SITE_URL } from "./site-url";
import { unsubscribeLink } from "./newsletter";
import { SLOTS } from "./pub-slots";

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

export async function monthlyRegieReport(): Promise<boolean> {
  const to = process.env.CONTACT_EMAIL ?? process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1];
  if (!to) return false;
  const now = new Date();
  const debut = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const fin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const stats = await db.bannerStat.groupBy({
    by: ["bannerId"],
    where: { day: { gte: debut, lt: fin } },
    _sum: { impressions: true, clicks: true },
  });
  if (stats.length === 0) return false;
  const banners = await db.banner.findMany({ where: { id: { in: stats.map((s) => s.bannerId) } }, select: { id: true, title: true, advertiser: true, slot: true, house: true } });
  const slotLabel = new Map(SLOTS.map((s) => [s.code, s.label]));
  const byId = new Map(banners.map((b) => [b.id, b]));
  const rows = stats
    .map((s) => {
      const b = byId.get(s.bannerId);
      return { advertiser: b?.advertiser ?? "?", title: b?.title ?? s.bannerId, slot: (b && slotLabel.get(b.slot)) ?? "", house: b?.house ?? false, impressions: s._sum.impressions ?? 0, clicks: s._sum.clicks ?? 0 };
    })
    .sort((a, b) => b.impressions - a.impressions);
  const mois = debut.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
  await sendRegieReport(to, mois, rows, `${SITE_URL}/api/admin/export/regie?jours=31`);
  return true;
}

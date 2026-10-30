import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/* Export des données personnelles du compte connecté (JSON en pièce jointe). */

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Connexion requise", { status: 401 });
  const userId = session.user.id;

  const [user, profile, contents, alerts, applications, messages, favorites, hosting, reports, blocks] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerified: true, name: true, image: true, role: true, accountType: true, status: true, createdAt: true, updatedAt: true },
    }),
    db.profile.findUnique({
      where: { userId },
      include: {
        keywords: { select: { keyword: { select: { name: true, slug: true, family: true } } } },
        company: true,
        association: true,
        artist: true,
      },
    }),
    db.content.findMany({
      where: { ownerProfile: { userId } },
      orderBy: { createdAt: "desc" },
      include: { keywords: { select: { keyword: { select: { name: true, slug: true } } } }, job: true, event: true, classified: true, place: true, deal: true },
    }),
    db.alert.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    db.application.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { content: { select: { title: true, slug: true, type: true } } },
    }),
    db.message.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      orderBy: { createdAt: "asc" },
      select: { id: true, body: true, createdAt: true, readAt: true, parentId: true, fromUserId: true, to: { select: { displayName: true } }, from: { select: { profile: { select: { displayName: true } } } }, content: { select: { title: true } } },
    }),
    db.favorite.findMany({ where: { userId }, include: { content: { select: { title: true, slug: true, type: true } } } }),
    db.hostingOffer.findFirst({ where: { profile: { userId } } }),
    db.report.findMany({ where: { reporterId: userId }, select: { reason: true, status: true, createdAt: true, content: { select: { title: true } } } }),
    db.userBlock.findMany({ where: { blockerId: userId }, select: { createdAt: true, blocked: { select: { profile: { select: { displayName: true } } } } } }),
  ]);
  if (!user) return new Response("Compte introuvable", { status: 404 });

  const keywordIds = [...new Set(alerts.flatMap((a) => a.keywordIds as string[]))];
  const keywords = keywordIds.length ? await db.keyword.findMany({ where: { id: { in: keywordIds } }, select: { id: true, name: true } }) : [];
  const keywordName = new Map(keywords.map((k) => [k.id, k.name]));

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    profile: profile && { ...profile, keywords: profile.keywords.map((k) => k.keyword) },
    contents: contents.map((c) => ({ ...c, keywords: c.keywords.map((k) => k.keyword) })),
    alerts: alerts.map((a) => ({ ...a, keywords: (a.keywordIds as string[]).map((id) => keywordName.get(id) ?? id) })),
    applications,
    messages: messages.map((m) => ({ id: m.id, envoye: m.fromUserId === userId, de: m.fromUserId === userId ? "moi" : (m.from.profile?.displayName ?? "membre"), a: m.fromUserId === userId ? m.to.displayName : "moi", sujet: m.content?.title ?? null, body: m.body, createdAt: m.createdAt, readAt: m.readAt, parentId: m.parentId })),
    favorites: favorites.map((f) => ({ ...f.content, addedAt: f.createdAt })),
    hosting,
    reports,
    blocks: blocks.map((b) => ({ membre: b.blocked.profile?.displayName ?? "membre", depuis: b.createdAt })),
  };

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="beninois-du-monde-mes-donnees-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

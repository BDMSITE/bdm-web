import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState, fmtDate } from "@/components/site/content";
import { RelayForm } from "@/components/site/relay-form";
import { BlockButton } from "./block-button";
import { contentHref, profileHref } from "@/lib/routes";

export const metadata: Metadata = { title: "Mes messages" };

/* Messagerie relais : fils de discussion (message racine + réponses) où
   l'utilisateur est expéditeur ou destinataire. Les adresses e-mail ne
   circulent jamais. */

type Props = { searchParams: Promise<{ fil?: string }> };

export default async function MessagesPage({ searchParams }: Props) {
  const [session, sp] = await Promise.all([auth(), searchParams]);
  const me = session!.user.id;

  const roots = await db.message.findMany({
    where: { parentId: null, OR: [{ fromUserId: me }, { toUserId: me }] },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      from: { select: { id: true, profile: { select: { displayName: true, slug: true } } } },
      to: { select: { userId: true, displayName: true, slug: true } },
      content: { select: { title: true, type: true, slug: true } },
      replies: { orderBy: { createdAt: "asc" }, include: { from: { select: { id: true, profile: { select: { displayName: true } } } } } },
    },
  });
  const nonLus = await db.message.count({ where: { toUserId: me, readAt: null } });

  const blocked = new Set((await db.userBlock.findMany({ where: { blockerId: me }, select: { blockedId: true } })).map((b) => b.blockedId));
  const current = roots.find((r) => r.id === sp.fil) ?? roots[0] ?? null;
  /* Lu seulement quand le fil est ouvert explicitement (clic), pas à la simple arrivée sur la page. */
  if (current && sp.fil === current.id) {
    await db.message.updateMany({
      where: { toUserId: me, readAt: null, OR: [{ id: current.id }, { parentId: current.id }] },
      data: { readAt: new Date() },
    });
  }

  const autre = (r: (typeof roots)[number]) =>
    r.fromUserId === me
      ? { name: r.to.displayName, slug: r.to.slug, userId: r.to.userId }
      : { name: r.from.profile?.displayName ?? "Membre", slug: r.from.profile?.slug ?? null, userId: r.from.id };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Mes messages</h1>
        <p className="mt-1 text-sm text-ink-2">
          Les échanges passent par le site : votre adresse e-mail n&apos;est jamais transmise.
          {nonLus > 0 && <> <strong className="text-primary">{nonLus} non lu{nonLus > 1 ? "s" : ""}</strong>.</>}
        </p>
      </div>

      {roots.length === 0 ? (
        <EmptyState title="Aucun message" text="Écrivez à un membre depuis sa fiche, ou répondez à une offre ou une annonce : la conversation apparaîtra ici." href="/communaute/membres" cta="Voir l'annuaire" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <ul className="divide-y divide-line border border-line">
            {roots.map((r) => {
              const a = autre(r);
              const unread = r.toUserId === me && !r.readAt || r.replies.some((x) => x.from.id !== me && !x.readAt);
              return (
                <li key={r.id}>
                  <Link href={`/compte/messages?fil=${r.id}`} className={`block px-4 py-3 text-sm hover:bg-primary-faint ${current?.id === r.id ? "bg-primary-faint" : ""}`}>
                    <p className={`truncate ${unread ? "font-extrabold" : "font-semibold"}`}>{a.name}</p>
                    {r.content && <p className="truncate text-xs text-muted">{r.content.title}</p>}
                    <p className="text-xs text-muted">{fmtDate(r.createdAt, { day: "numeric", month: "short" })}</p>
                  </Link>
                </li>
              );
            })}
          </ul>

          {current && (
            <section className="border border-line">
              <div className="border-b border-line bg-paper-2 px-4 py-3 text-sm">
                <p className="font-bold">
                  {autre(current).slug ? <Link href={profileHref(autre(current).slug!)} className="hover:text-primary">{autre(current).name}</Link> : autre(current).name}
                </p>
                {current.content && (
                  <p className="text-xs text-muted">
                    Au sujet de <Link href={contentHref(current.content.type, current.content.slug)} className="font-semibold text-primary hover:underline">{current.content.title}</Link>
                  </p>
                )}
                <div className="mt-1"><BlockButton userId={autre(current).userId} name={autre(current).name} blocked={blocked.has(autre(current).userId)} /></div>
              </div>
              <ol className="space-y-3 p-4">
                {[current, ...current.replies].map((m) => {
                  const mine = m.fromUserId === me;
                  return (
                    <li key={m.id} className={`max-w-[85%] rounded border p-3 text-sm ${mine ? "ml-auto border-primary bg-primary-faint" : "border-line bg-paper"}`}>
                      <p className="whitespace-pre-line">{m.body}</p>
                      <p className="mt-1 text-[0.7rem] text-muted">{mine ? "Vous" : ("profile" in m.from ? m.from.profile?.displayName : "Membre") ?? "Membre"} · {fmtDate(m.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </li>
                  );
                })}
              </ol>
              <div className="border-t border-line p-4">
                <RelayForm parentId={current.id} label="Répondre" compact />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

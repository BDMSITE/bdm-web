import Link from "next/link";
import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SLOT_BY_CODE } from "@/lib/pub-slots";
import { fmtDate } from "@/components/site/content";
import { PubForm } from "./form";

export const metadata: Metadata = { title: "Ma publicité" };

/* Espace annonceur du membre : ses campagnes (état, période, résultats) et
   le dépôt d'une nouvelle campagne. La régie valide avant diffusion. */

const STATUT: Record<string, { l: string; cls: string }> = {
  DRAFT: { l: "Brouillon", cls: "bg-paper-2 text-ink-2 border border-line" },
  IN_MODERATION: { l: "En validation", cls: "bg-accent-light text-ink" },
  PUBLISHED: { l: "En diffusion", cls: "bg-primary-light text-primary-dark" },
  REJECTED: { l: "Non retenue", cls: "bg-danger-light text-danger" },
  ARCHIVED: { l: "Terminée", cls: "bg-paper-2 text-ink-2 border border-line" },
};

export default async function PublicitePage({ searchParams }: { searchParams: Promise<{ nouvelle?: string }> }) {
  const [session, sp] = await Promise.all([auth(), searchParams]);
  const profile = await db.profile.findUnique({ where: { userId: session!.user.id }, select: { id: true } });
  const campagnes = profile
    ? await db.banner.findMany({ where: { profileId: profile.id }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, slot: true, status: true, startsAt: true, endsAt: true, impressions: true, clicks: true } })
    : [];
  const ouvrir = sp.nouvelle === "1" || campagnes.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Ma publicité</h1>
        <p className="mt-1 text-sm text-ink-2">
          Faites connaître votre activité aux Béninois du monde : votre campagne tourne dans les encarts du site, en bureau et sur mobile.{" "}
          <Link href="/annonceurs" className="font-bold text-primary hover:underline">Voir les formats</Link>.
        </p>
      </div>

      {campagnes.length > 0 && (
        <ul className="divide-y divide-line border border-line text-sm">
          {campagnes.map((c) => {
            const st = STATUT[c.status];
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 p-4">
                <Megaphone aria-hidden className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <Link href={`/compte/publicite/${c.id}`} className="font-bold hover:text-primary hover:underline">{c.title}</Link>
                  <p className="text-xs text-muted">{SLOT_BY_CODE[c.slot].label} · {fmtDate(c.startsAt)} → {c.endsAt ? fmtDate(c.endsAt) : "à définir"}</p>
                </div>
                {c.status === "PUBLISHED" && <span className="text-xs tabular-nums text-ink-2">{c.impressions} affichages · {c.clicks} clics</span>}
                <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold ${st.cls}`}>{st.l}</span>
                <Link href={`/compte/publicite/${c.id}`} className="whitespace-nowrap text-xs font-bold uppercase text-primary hover:underline">Gérer</Link>
              </li>
            );
          })}
        </ul>
      )}

      {ouvrir ? (
        <section className="space-y-4 border border-line p-5">
          <h2 className="section-title text-lg">Nouvelle <em>campagne</em></h2>
          <PubForm uploadEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
        </section>
      ) : (
        <Link href="/compte/publicite?nouvelle=1" className="inline-block rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">+ Nouvelle campagne</Link>
      )}
    </div>
  );
}

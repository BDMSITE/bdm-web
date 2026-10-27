import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SLOT_BY_CODE } from "@/lib/pub-slots";
import { fmtDate } from "@/components/site/content";
import { PubForm } from "../form";

export const metadata: Metadata = { title: "Ma campagne" };

/* Une campagne du membre : état, résultats, modification (→ revalidation), retrait. */

const ETAT: Record<string, string> = {
  DRAFT: "Brouillon, pas encore envoyée.",
  IN_MODERATION: "En validation par la régie : vous recevrez le tarif et la date de mise en ligne.",
  PUBLISHED: "En diffusion sur le site.",
  REJECTED: "Non retenue en l'état : modifiez-la et renvoyez-la.",
  ARCHIVED: "Terminée ou retirée.",
};

export default async function MaCampagnePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, auth()]);
  const banner = await db.banner.findFirst({ where: { id, profile: { userId: session!.user.id } }, include: { stats: { orderBy: { day: "desc" }, take: 14 } } });
  if (!banner) notFound();

  return (
    <div className="space-y-6">
      <Link href="/compte/publicite" className="text-sm font-bold text-primary hover:underline">← Mes campagnes</Link>
      <div>
        <h1 className="font-display text-2xl font-extrabold">{banner.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{SLOT_BY_CODE[banner.slot].label} · {ETAT[banner.status]}</p>
      </div>

      {banner.impressions > 0 && (
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { n: banner.impressions, l: "affichages" },
            { n: banner.clicks, l: "clics" },
            { n: `${((banner.clicks / banner.impressions) * 100).toFixed(2)} %`, l: "taux de clic" },
          ].map((s) => (
            <div key={s.l} className="border border-line p-4">
              <span className="font-display text-2xl font-extrabold text-primary">{s.n}</span>
              <p className="text-sm text-ink-2">{s.l}</p>
            </div>
          ))}
          {banner.stats.length > 0 && (
            <p className="text-xs text-muted sm:col-span-3">
              Derniers jours : {banner.stats.map((s) => `${fmtDate(s.day)} ${s.impressions}/${s.clicks}`).join(" · ")} (affichages/clics)
            </p>
          )}
        </section>
      )}

      <section className="border border-line p-5">
        <PubForm banner={banner} uploadEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
      </section>
    </div>
  );
}

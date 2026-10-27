import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SLOT_BY_CODE } from "@/lib/pub";
import { PageHead, Card, fmtDate, fmtNumber } from "@/components/admin/ui";
import { BannerForm } from "../banner-form";

export const metadata: Metadata = { title: "Campagne" };

/* Édition d'une campagne + ses 30 derniers jours de statistiques. */

export default async function AdminBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const banner = await db.banner.findUnique({ where: { id }, include: { stats: { orderBy: { day: "desc" }, take: 30 } } });
  if (!banner) notFound();
  const spec = SLOT_BY_CODE[banner.slot];
  const taux = banner.impressions ? ((banner.clicks / banner.impressions) * 100).toFixed(2) : "0";

  return (
    <>
      <Link href="/admin/regie" className="text-sm font-bold text-primary hover:underline">← Retour à la régie</Link>
      <PageHead title={banner.title} desc={`${banner.advertiser} · ${spec.label} · créée le ${fmtDate(banner.createdAt)}`} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card title="Campagne">
          <BannerForm banner={banner} />
        </Card>
        <div className="space-y-6">
          <Card title="Résultats">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-muted">Affichages</dt><dd className="font-bold tabular-nums">{fmtNumber(banner.impressions)}</dd>
              <dt className="text-muted">Clics</dt><dd className="font-bold tabular-nums">{fmtNumber(banner.clicks)}</dd>
              <dt className="text-muted">Taux de clic</dt><dd className="font-bold tabular-nums">{taux} %</dd>
            </dl>
            {banner.stats.length > 0 && (
              <table className="mt-4 w-full text-xs">
                <thead><tr className="text-left text-muted"><th className="py-1">Jour</th><th className="py-1 text-right">Affich.</th><th className="py-1 text-right">Clics</th></tr></thead>
                <tbody>
                  {banner.stats.map((s) => (
                    <tr key={String(s.day)} className="border-t border-line">
                      <td className="py-1">{fmtDate(s.day)}</td>
                      <td className="py-1 text-right tabular-nums">{s.impressions}</td>
                      <td className="py-1 text-right tabular-nums">{s.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card title="Aperçu">
            <p className="text-xs text-muted">Le rendu réel dépend de la page : ouvrez le site pour voir la rotation.</p>
            {banner.image && <Image src={banner.image} alt={banner.alt} width={300} height={160} unoptimized className="mt-3 h-auto max-h-40 w-auto border border-line" />}
          </Card>
        </div>
      </div>
    </>
  );
}

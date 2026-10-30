import Link from "next/link";
import { utcToLocalInput, DEFAULT_TZ } from "@/lib/temps";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CONTENT_LABEL, contentHref } from "@/lib/routes";
import { PageHead, TypeBadge, ContentStatusBadge, ADMIN_LIST_HREF, fmtDateTime } from "@/components/admin/ui";
import type { ContentFormValues } from "../content-form";
import { EditContentForm } from "./form";

export const metadata: Metadata = { title: "Modifier un contenu" };

/* Édition admin de n'importe quel contenu (tous types, tous statuts).
   L'accès est filtré par proxy.ts (rôle rédaction / modération / admin). */

const p = (n: number) => String(n).padStart(2, "0");
/* Date → valeur d'un champ date (AAAA-MM-JJ). */
const toDateInput = (d: Date | null | undefined) => (d ? `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` : "");

export default async function AdminEditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = await db.content.findUnique({
    where: { id },
    include: { job: true, event: true, place: true, classified: true, deal: true, keywords: { include: { keyword: true } }, ownerProfile: { select: { displayName: true, slug: true } } },
  });
  if (!content) notFound();

  const values: ContentFormValues = {
    title: content.title,
    excerpt: content.excerpt ?? "",
    body: content.body ?? "",
    country: content.country ?? "",
    city: content.city ?? "",
    keywords: content.keywords.map((k) => k.keyword.name).join(", "),
    cover: content.cover ?? "",
    lat: content.lat !== null ? String(content.lat) : "",
    lng: content.lng !== null ? String(content.lng) : "",
    featured: content.featured,
    expiresAt: toDateInput(content.expiresAt),
    contractType: content.job?.contractType ?? "",
    salary: content.job?.salary ?? "",
    applyMode: content.job?.applyMode ?? "relay_email",
    applyTarget: content.job?.applyTarget ?? "",
    startsAt: utcToLocalInput(content.event?.startsAt, content.event?.timezone ?? DEFAULT_TZ),
    endsAt: utcToLocalInput(content.event?.endsAt, content.event?.timezone ?? DEFAULT_TZ),
    timezone: content.event?.timezone ?? "",
    venue: content.event?.venue ?? "",
    isOnline: content.event?.isOnline ?? false,
    category: content.event?.category ?? content.place?.category ?? content.classified?.category ?? "",
    ticketUrl: content.event?.ticketUrl ?? "",
    address: content.place?.address ?? "",
    phone: content.place?.phone ?? "",
    hours: content.place?.hours ?? "",
    verified: content.place?.verified ?? false,
    price: content.classified?.price ?? "",
    promoCode: content.deal?.promoCode ?? "",
    conditions: content.deal?.conditions ?? "",
    validFrom: toDateInput(content.deal?.validFrom),
    validTo: toDateInput(content.deal?.validTo),
  };

  const retour = ADMIN_LIST_HREF[content.type];

  return (
    <>
      <p className="mb-4 text-sm">
        <Link href={retour} className="font-bold text-primary hover:underline">← Retour à la liste</Link>
      </p>
      <PageHead title={content.title} desc={`${CONTENT_LABEL[content.type]} · créé le ${fmtDateTime(content.createdAt)} · modifié le ${fmtDateTime(content.updatedAt)}`}>
        {content.status === "PUBLISHED" && (
          <Link href={contentHref(content.type, content.slug)} className="whitespace-nowrap rounded border border-line bg-paper px-4 py-2 text-sm font-bold text-ink-2 hover:border-primary hover:text-primary">
            Voir la fiche
          </Link>
        )}
      </PageHead>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-2">
        <TypeBadge type={content.type} />
        <ContentStatusBadge status={content.status} />
        <span>
          Auteur :{" "}
          {content.ownerProfile ? (
            <Link href={`/communaute/membres/${content.ownerProfile.slug}`} className="font-bold hover:text-primary hover:underline">{content.ownerProfile.displayName}</Link>
          ) : (
            "rédaction"
          )}
        </span>
        <span className="text-muted">Adresse : {content.slug}</span>
      </div>

      <EditContentForm id={content.id} type={content.type} status={content.status} values={values} />
    </>
  );
}

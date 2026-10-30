import Link from "next/link";
import { utcToLocalInput } from "@/lib/temps";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONTENT_LABEL, contentHref } from "@/lib/routes";
import { fmtDate } from "@/components/site/content";
import { StatusBadge } from "../status";
import { PublicationForm, WithdrawButton, RepublishButton } from "./form";

export const metadata: Metadata = { title: "Modifier une publication" };

/* Édition d'une publication : réservée au propriétaire (sinon 404). */


export default async function EditPublicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/connexion?callbackUrl=/compte/publications/${id}`);

  const content = await db.content.findFirst({
    where: { id, ownerProfile: { userId: session.user.id } },
    include: { job: true, event: true, place: true, classified: true, keywords: { include: { keyword: true } } },
  });
  if (!content) notFound();

  return (
    <div className="space-y-6">
      <p className="text-sm">
        <Link href="/compte/publications" className="font-bold text-primary hover:underline">← Mes publications</Link>
      </p>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{CONTENT_LABEL[content.type]}</p>
          <h1 className="font-display mt-1 text-2xl font-extrabold">{content.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
            <StatusBadge status={content.status} />
            {content.publishedAt && <span>Publié le {fmtDate(content.publishedAt)}</span>}
            <span>Modifié le {fmtDate(content.updatedAt)}</span>
          </p>
        </div>
        {content.status === "PUBLISHED" && (
          <Link href={contentHref(content.type, content.slug)} className="whitespace-nowrap rounded border-2 border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white">
            Voir la fiche
          </Link>
        )}
      </div>

      <PublicationForm
        id={content.id}
        type={content.type}
        status={content.status}
        values={{
          title: content.title,
          excerpt: content.excerpt ?? "",
          body: content.body ?? "",
          country: content.country ?? "",
          city: content.city ?? "",
          keywords: content.keywords.map((k) => k.keyword.name).join(", "),
          contractType: content.job?.contractType ?? "",
          startsAt: content.event ? utcToLocalInput(content.event.startsAt, content.event.timezone) : "",
          timezone: content.event?.timezone ?? "",
          venue: content.event?.venue ?? "",
          isOnline: content.event?.isOnline ?? false,
          category: content.event?.category ?? content.place?.category ?? content.classified?.category ?? "",
          address: content.place?.address ?? "",
          price: content.classified?.price ?? "",
        }}
      />

      <section className="border border-line p-5">
        <h2 className="font-display text-lg font-bold">{content.status === "ARCHIVED" ? "Remettre en ligne" : "Retirer de la ligne"}</h2>
        <p className="mt-1 text-sm text-ink-2">
          {content.status === "ARCHIVED"
            ? "Ce contenu est retiré du site. Republier le renvoie en modération ; il sera remis en ligne après relecture."
            : "Un contenu retiré n'est plus visible sur le site mais reste dans votre espace : vous pourrez le republier plus tard."}
        </p>
        <div className="mt-3">
          {content.status === "ARCHIVED" ? <RepublishButton id={content.id} /> : <WithdrawButton id={content.id} />}
        </div>
      </section>
    </div>
  );
}

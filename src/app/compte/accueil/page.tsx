import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hostingAudience } from "@/lib/competences";
import { HostingForm } from "./form";

export const metadata: Metadata = { title: "Ma fiche d'accueil" };

/* Accueil & hébergement (CDC §7.10) : un membre propose d'accueillir des étudiants,
   des visiteurs ou des afrodescendants. Fiche relue par le HCBE, contacts par
   messagerie relais, aucune coordonnée publiée. */

const STATUS_LABEL: Record<string, string> = {
  IN_MODERATION: "En relecture par le HCBE",
  PUBLISHED: "En ligne",
  REJECTED: "Non retenue",
  ARCHIVED: "Retirée",
  DRAFT: "Brouillon",
  SCHEDULED: "Programmée",
  EXPIRED: "Expirée",
};

export default async function AccueilComptePage() {
  const session = await auth();
  const profile = await db.profile.findUnique({ where: { userId: session!.user.id }, select: { id: true, city: true, country: true, hosting: true } });
  if (!profile) return <p className="text-sm text-muted">Profil introuvable.</p>;
  const h = profile.hosting;
  const TONES: Record<string, string> = { IN_MODERATION: "border-accent bg-accent-light", PUBLISHED: "border-primary bg-primary-faint", REJECTED: "border-danger bg-danger-light" };
  const tone = (h && TONES[h.status]) || "border-line";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Ma fiche d&apos;accueil</h1>
        <p className="mt-1 text-sm text-ink-2">
          Accueillir un étudiant qui arrive, un visiteur de passage ou un afrodescendant en voyage au Bénin. Le HCBE échange avec vous avant la mise en ligne dans{" "}
          <Link href="/pratique/accueil" className="font-bold text-primary hover:underline">Accueil &amp; hébergement</Link>. Vos coordonnées ne sont jamais publiées.
        </p>
      </div>

      <div className={`rounded border p-4 text-sm ${tone}`}>
        <p className="font-bold">Statut : {h ? STATUS_LABEL[h.status] ?? h.status : "Aucune fiche"}</p>
        {h?.status === "PUBLISHED" && <p className="mt-1 text-ink-2">Votre fiche est visible. Les demandes arrivent dans <Link href="/compte/messages" className="font-bold text-primary hover:underline">vos messages</Link>.</p>}
        {h?.status === "IN_MODERATION" && <p className="mt-1 text-ink-2">Le HCBE relit votre fiche et peut vous écrire pour un échange avant publication.</p>}
      </div>

      <HostingForm
        values={{
          kind: h?.kind ?? "",
          audience: hostingAudience(h?.audience),
          city: h?.city ?? profile.city ?? "",
          country: h?.country ?? profile.country ?? "",
          capacity: h?.capacity ? String(h.capacity) : "",
          duration: h?.duration ?? "",
          conditions: h?.conditions ?? "",
        }}
        exists={Boolean(h && h.status !== "ARCHIVED")}
      />
    </div>
  );
}

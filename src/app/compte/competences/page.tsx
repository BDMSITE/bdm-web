import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EXPERT_STATUS_LABEL, expertModes } from "@/lib/competences";
import { ExpertForm } from "./form";

export const metadata: Metadata = { title: "Mes compétences pour le Bénin" };

/* Compétences de la diaspora (CDC §7.9) : le membre décrit son expertise et ses
   disponibilités ; le HCBE relit avant publication dans la rubrique. */

export default async function CompetencesComptePage() {
  const session = await auth();
  const profile = await db.profile.findUnique({
    where: { userId: session!.user.id },
    select: { slug: true, expertStatus: true, expertDomain: true, expertModes: true, expertPitch: true, expertAt: true, city: true, country: true, headline: true },
  });
  if (!profile) return <p className="text-sm text-muted">Profil introuvable.</p>;

  const tone = { NONE: "border-line", PENDING: "border-accent bg-accent-light", APPROVED: "border-primary bg-primary-faint", REJECTED: "border-danger bg-danger-light" }[profile.expertStatus];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Mes compétences pour le Bénin</h1>
        <p className="mt-1 text-sm text-ink-2">
          Mentorat, mission courte, conseil à distance : décrivez ce que vous pouvez apporter à un projet au Bénin. Le HCBE relit chaque proposition avant de la publier dans{" "}
          <Link href="/communaute/competences" className="font-bold text-primary hover:underline">Compétences de la diaspora</Link>.
        </p>
      </div>

      <div className={`rounded border p-4 text-sm ${tone}`}>
        <p className="font-bold">Statut : {EXPERT_STATUS_LABEL[profile.expertStatus]}</p>
        {profile.expertStatus === "APPROVED" && (
          <p className="mt-1 text-ink-2">
            Votre profil est visible dans la rubrique. Les porteurs de projet vous écrivent via votre{" "}
            <Link href={`/communaute/membres/${profile.slug}`} className="font-bold text-primary hover:underline">fiche</Link> : votre e-mail n&apos;est jamais exposé.
          </p>
        )}
        {profile.expertStatus === "PENDING" && <p className="mt-1 text-ink-2">Le HCBE relit votre proposition. Vous pouvez encore la modifier ci-dessous.</p>}
        {profile.expertStatus === "REJECTED" && <p className="mt-1 text-ink-2">Votre proposition n&apos;a pas été retenue en l&apos;état. Complétez-la et renvoyez-la.</p>}
        {(!profile.city || !profile.country) && (
          <p className="mt-2 text-ink-2">
            Indiquez votre ville et votre pays dans <Link href="/compte/profil" className="font-bold text-primary hover:underline">votre profil</Link> : la rubrique affiche où vous exercez.
          </p>
        )}
      </div>

      <ExpertForm
        values={{ domain: profile.expertDomain ?? "", modes: expertModes(profile.expertModes), pitch: profile.expertPitch ?? "" }}
        status={profile.expertStatus}
      />
    </div>
  );
}

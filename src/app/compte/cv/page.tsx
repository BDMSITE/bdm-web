import Link from "next/link";
import type { Metadata } from "next";
import { FileUser } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CvForm } from "./form";
import { cvRoute } from "@/lib/cv";

export const metadata: Metadata = { title: "Mon CV" };

/* CV du membre connecté : lien et visibilité auprès des recruteurs (CDC §7.3). */

export default async function CvPage() {
  const session = await auth();
  const [profile, nbCandidatures] = await Promise.all([
    db.profile.findUnique({ where: { userId: session!.user.id }, select: { id: true, cvUrl: true, cvPublished: true } }),
    db.application.count({ where: { userId: session!.user.id } }),
  ]);
  if (!profile) return <p className="text-sm text-muted">Profil introuvable.</p>;
  const hosted = profile.cvUrl === cvRoute(profile.id);
  const uploadEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Mon CV</h1>
        <p className="mt-1 text-sm text-ink-2">Votre CV sert à postuler aux offres et, si vous l&apos;acceptez, à être trouvé·e par les recruteurs.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 border border-line p-5">
        <FileUser aria-hidden className="h-10 w-10 text-primary" strokeWidth={1.8} />
        <div className="min-w-0 flex-1">
          {profile.cvUrl ? (
            <>
              <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" className="break-all font-bold text-primary hover:underline">
                {hosted ? "Mon CV déposé (PDF)" : profile.cvUrl}
              </a>
              <p className="text-xs text-muted">{profile.cvPublished ? "Visible des recruteurs" : "Réservé à vos candidatures"}</p>
            </>
          ) : (
            <>
              <p className="font-bold">Aucun CV enregistré</p>
              <p className="text-xs text-muted">{uploadEnabled ? "Déposez un PDF ou ajoutez un lien ci-dessous." : "Ajoutez le lien de votre CV ci-dessous."}</p>
            </>
          )}
        </div>
      </div>

      <CvForm cvUrl={profile.cvUrl ?? ""} cvPublished={profile.cvPublished} hosted={hosted} uploadEnabled={uploadEnabled} />

      <p className="text-sm text-ink-2">
        {nbCandidatures === 0 ? "Aucune candidature envoyée" : `${nbCandidatures} candidature${nbCandidatures > 1 ? "s" : ""} envoyée${nbCandidatures > 1 ? "s" : ""}`}
        {" — "}
        <Link href="/compte/candidatures" className="font-bold text-primary hover:underline">voir mes candidatures →</Link>
      </p>
    </div>
  );
}

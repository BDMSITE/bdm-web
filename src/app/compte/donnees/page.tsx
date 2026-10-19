import Link from "next/link";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DeleteAccountForm } from "./form";

export const metadata: Metadata = { title: "Mes données" };

/* Export et suppression des données du compte connecté (APDP / RGPD — CDC §10.3). */

export default async function DonneesPage() {
  const session = await auth();
  const profile = await db.profile.findUnique({
    where: { userId: session!.user.id },
    select: { visibility: true, cvPublished: true },
  });
  const directory = ((profile?.visibility ?? {}) as { directory?: boolean }).directory !== false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Mes données</h1>
        <p className="mt-1 text-sm text-ink-2">
          Vos droits sur vos données personnelles (loi béninoise 2017-20 et RGPD) : consulter, exporter, supprimer.
        </p>
      </div>

      <div className="space-y-2 border border-line p-5">
        <p className="font-bold">Ce que vous avez choisi</p>
        <ul className="space-y-1 text-sm text-ink-2">
          <li>
            Annuaire public des membres : <strong className="text-ink">{directory ? "vous y apparaissez" : "vous n'y apparaissez pas"}</strong>
            {" — "}
            <Link href="/compte/profil" className="font-bold text-primary hover:underline">modifier</Link>
          </li>
          <li>
            CV visible des recruteurs : <strong className="text-ink">{profile?.cvPublished ? "oui" : "non"}</strong>
            {" — "}
            <Link href="/compte/cv" className="font-bold text-primary hover:underline">modifier</Link>
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-4 border border-line p-5">
        <div className="min-w-0 flex-1">
          <p className="font-bold">Télécharger mes données</p>
          <p className="text-sm text-ink-2">Compte, profil, publications, alertes et candidatures dans un fichier JSON, généré immédiatement.</p>
        </div>
        <a
          href="/api/compte/export"
          download
          className="whitespace-nowrap rounded border-2 border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white"
        >
          <Download aria-hidden className="mr-1.5 inline h-4 w-4" /> Télécharger mes données
        </a>
      </div>

      <DeleteAccountForm />
    </div>
  );
}

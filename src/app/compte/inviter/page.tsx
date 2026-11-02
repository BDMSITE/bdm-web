import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site-url";
import { InviteForm } from "./form";

export const metadata: Metadata = { title: "Inviter mes proches" };

/* Croissance par le bouche-à-oreille : e-mails d'invitation personnalisés + lien WhatsApp prêt à partager. */

export default async function InviterPage() {
  const session = await auth();
  const me = await db.profile.findUnique({ where: { userId: session!.user.id }, select: { displayName: true } });
  const prenom = me?.displayName.split(" ")[0] ?? "";
  const texte = `${prenom ? `${prenom} vous invite` : "Rejoignez-moi"} sur Béninois du Monde, le réseau de la diaspora béninoise : annuaire, emploi, événements, bons plans. Inscription gratuite : ${SITE_URL}/inscription`;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Inviter mes proches</h1>
        <p className="mt-1 text-sm text-ink-2">Famille, amis, collègues béninois ou amis du Bénin : plus la communauté est nombreuse, plus elle est utile. Les adresses ne servent qu&apos;à l&apos;invitation et ne sont pas conservées.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <InviteForm />
        <div className="space-y-4 border border-line p-5 text-sm">
          <p className="font-bold">Par WhatsApp ou vos réseaux</p>
          <p className="whitespace-pre-line rounded bg-paper-2 p-3 text-ink-2">{texte}</p>
          <div className="flex flex-wrap gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noopener noreferrer" className="rounded bg-[#25D366] px-4 py-2 text-sm font-bold text-white hover:opacity-90">Partager sur WhatsApp</a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${SITE_URL}/inscription`)}`} target="_blank" rel="noopener noreferrer" className="rounded border border-line px-4 py-2 text-sm font-bold text-ink-2 hover:border-primary hover:text-primary">Facebook</a>
          </div>
        </div>
      </div>
    </div>
  );
}

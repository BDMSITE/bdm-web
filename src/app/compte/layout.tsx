import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/site/chrome";
import { CompteSidebar } from "@/components/compte/sidebar";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adhesionProposee, isAdherent } from "@/lib/adhesion";

export const metadata: Metadata = {
  title: { default: "Mon espace", template: "%s — Mon espace" },
};

const TYPE_LABEL = { MEMBER: "Membre", COMPANY: "Entreprise", ASSOCIATION: "Association", ARTIST: "Artiste" } as const;

/* Coque de l'espace membre : menu latéral + contenu (CDC §7.16).
   Le proxy garantit une session ; le profil est chargé ici pour le menu. */

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte");

  const [profile, adhesion, adherent] = await Promise.all([
    db.profile.findUnique({
      where: { userId: session.user.id },
      select: { displayName: true, city: true, user: { select: { accountType: true } } },
    }),
    adhesionProposee(),
    isAdherent(session.user.id),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          <CompteSidebar
            name={profile?.displayName ?? session.user.name ?? "Mon espace"}
            meta={[profile ? TYPE_LABEL[profile.user.accountType] : null, profile?.city].filter(Boolean).join(" · ")}
            adhesion={adhesion}
            adherent={adhesion && adherent}
          />
          <div className="min-w-0">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

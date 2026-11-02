import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { flag } from "@/lib/settings";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/ui";
import { AdminMobileNav } from "@/components/admin/mobile-nav";

export const metadata: Metadata = {
  title: { default: "BDM Admin", template: "%s — BDM Admin" },
};

/* Coque du back-office : sidebar fixe + topbar + zone de travail.
   L'accès est filtré en amont par proxy.ts (rôle rédaction / modération / admin).
   Les pastilles de la nav sont calculées ici depuis la base. */

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  MODERATOR: "Modération",
  EDITOR: "Rédaction",
  REGIE: "Régie publicitaire",
  USER: "Membre",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, enModeration, signalements, deuxFacteursObligatoire, validationPro] = await Promise.all([
    auth(),
    db.content.count({ where: { status: "IN_MODERATION" } }),
    db.report.count({ where: { status: "open" } }),
    flag("securite.2fa_equipe"),
    flag("communaute.validation_pro"),
  ]);

  /* 2FA obligatoire pour l'équipe : sans secret TOTP, direction la page Sécurité. */
  if (deuxFacteursObligatoire && session?.user?.id) {
    const u = await db.user.findUnique({ where: { id: session.user.id }, select: { twoFactorSecret: true } });
    if (!u?.twoFactorSecret) redirect("/compte/securite?obligatoire=1");
  }

  const badges: Record<string, number> = {};
  if (enModeration + signalements > 0) badges["/admin/moderation"] = enModeration + signalements;
  if (validationPro) {
    const proAValider = await db.profile.count({ where: { proVerifiedAt: null, user: { status: "ACTIVE", accountType: { not: "MEMBER" } } } });
    if (proAValider > 0) badges["/admin/communaute"] = proAValider;
  }

  const user = session?.user
    ? {
        name: session.user.name || session.user.email || "Compte",
        roleLabel: ROLE_LABEL[session.user.role ?? ""] ?? "Membre",
      }
    : undefined;
  const regieSeule = session?.user?.role === "REGIE";

  return (
    <div className="flex min-h-screen bg-paper-2">
      <AdminSidebar badges={badges} user={user} only={regieSeule ? ["/admin/regie"] : undefined} />
      <div className="min-w-0 flex-1">
        <AdminTopbar />
        <AdminMobileNav only={regieSeule ? ["/admin/regie"] : undefined} />
        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}

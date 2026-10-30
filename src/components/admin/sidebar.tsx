"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  PenLine,
  Briefcase,
  Users,
  MapPin,
  Landmark,
  BadgeCheck,
  Upload,
  Radio,
  Megaphone,
  Mail,
  Tags,
  BarChart3,
  Settings,
  ScrollText,
  ExternalLink,
  type LucideIcon,
  Building2,
} from "lucide-react";

/* Barre latérale du back-office — 13 modules (CDC §7.17) + Compétences et En direct.
   Les pastilles sont calculées par le layout depuis la base (jamais de chiffre en dur). */

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Compteur affiché dans la nav (fourni par le layout, absent sinon). */
  badge?: number;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { label: "Modération", href: "/admin/moderation", icon: ShieldAlert },
  { label: "Rédaction", href: "/admin/redaction", icon: PenLine },
  { label: "Emploi", href: "/admin/emploi", icon: Briefcase },
  { label: "Communauté", href: "/admin/communaute", icon: Users },
  { label: "Compétences", href: "/admin/competences", icon: BadgeCheck },
  { label: "Imports de membres", href: "/admin/imports", icon: Upload },
  { label: "Services", href: "/admin/services", icon: MapPin },
  { label: "Mémoire & HCBE", href: "/admin/memoire", icon: Landmark },
  { label: "Ambassades & consulats", href: "/admin/consulats", icon: Building2 },
  { label: "Régie pub", href: "/admin/regie", icon: Megaphone },
  { label: "Newsletter & alertes", href: "/admin/newsletter", icon: Mail },
  { label: "En direct (ticker)", href: "/admin/direct", icon: Radio },
  { label: "Mots-clés", href: "/admin/mots-cles", icon: Tags },
  { label: "Statistiques", href: "/admin/statistiques", icon: BarChart3 },
  { label: "Paramètres", href: "/admin/parametres", icon: Settings },
  { label: "Journal d'activité", href: "/admin/journal", icon: ScrollText },
];

export type AdminSidebarProps = {
  /** Compteurs par href, calculés depuis la base (ex. { "/admin/moderation": 3 }). */
  badges?: Record<string, number>;
  /** Personne connectée (nom + libellé du rôle). */
  user?: { name: string; roleLabel: string };
  /** Restreint la navigation à ces entrées (rôle Régie). */
  only?: string[];
};

export function AdminSidebar({ badges = {}, user, only }: AdminSidebarProps) {
  const nav = only ? ADMIN_NAV.filter((n) => only.includes(n.href)) : ADMIN_NAV;
  const pathname = usePathname();
  const initial = (user?.name ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-primary-darker text-white max-lg:hidden sticky top-0">
      <Link href="/admin" className="block border-b border-white/10 px-5 py-5">
        <span className="font-display text-xl font-extrabold leading-none">
          BDM <span className="text-accent">Admin</span>
        </span>
        <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.2em] text-white/50">
          Béninois du Monde
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {nav.map((n) => {
          const active =
            n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
          const badge = badges[n.href] ?? n.badge;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`mb-0.5 flex items-center gap-3 rounded px-3 py-2.5 text-sm font-semibold ${
                active
                  ? "bg-accent text-ink"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <n.icon aria-hidden className="h-4.5 w-4.5 shrink-0" strokeWidth={2.2} />
              <span className="flex-1">{n.label}</span>
              {badge ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
                    active ? "bg-ink text-white" : "bg-accent text-ink"
                  }`}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        {user && (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-display font-bold text-ink">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{user.name}</p>
              <p className="text-xs text-white/50">{user.roleLabel}</p>
            </div>
          </div>
        )}
        <Link
          href="/"
          className="mt-3 flex items-center justify-center gap-2 rounded border border-white/25 py-2 text-xs font-bold uppercase tracking-wide text-white/80 hover:border-accent hover:text-accent"
        >
          <ExternalLink aria-hidden className="h-3.5 w-3.5" /> Voir le site
        </Link>
      </div>
    </aside>
  );
}

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
  Radio,
  Megaphone,
  Mail,
  Tags,
  BarChart3,
  Settings,
  ScrollText,
  ExternalLink,
} from "lucide-react";

/* Barre latérale du back-office — 13 modules (CDC §7.17) + Compétences et En direct. */

export const ADMIN_NAV = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { label: "Modération", href: "/admin/moderation", icon: ShieldAlert, badge: 19 },
  { label: "Rédaction", href: "/admin/redaction", icon: PenLine },
  { label: "Emploi", href: "/admin/emploi", icon: Briefcase, badge: 2 },
  { label: "Communauté", href: "/admin/communaute", icon: Users },
  { label: "Compétences", href: "/admin/competences", icon: BadgeCheck, badge: 4 },
  { label: "Services", href: "/admin/services", icon: MapPin },
  { label: "Mémoire & HCBE", href: "/admin/memoire", icon: Landmark },
  { label: "Régie pub", href: "/admin/regie", icon: Megaphone },
  { label: "Newsletter & alertes", href: "/admin/newsletter", icon: Mail },
  { label: "En direct (ticker)", href: "/admin/direct", icon: Radio },
  { label: "Mots-clés", href: "/admin/mots-cles", icon: Tags },
  { label: "Statistiques", href: "/admin/statistiques", icon: BarChart3 },
  { label: "Paramètres", href: "/admin/parametres", icon: Settings },
  { label: "Journal d'activité", href: "/admin/journal", icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();
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
        {ADMIN_NAV.map((n) => {
          const active =
            n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
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
              {n.badge && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
                    active ? "bg-ink text-white" : "bg-danger text-white"
                  }`}
                >
                  {n.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-display font-bold text-ink">
            J
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">Josué</p>
            <p className="text-xs text-white/50">Administrateur</p>
          </div>
        </div>
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

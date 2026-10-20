"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserRound,
  FileText,
  Bell,
  FileUser,
  Send,
  Inbox,
  MessageSquare,
  Heart,
  ShieldCheck,
  DatabaseBackup,
} from "lucide-react";

/* Menu de l'espace membre (CDC §7.16). */

const MENU = [
  { label: "Tableau de bord", href: "/compte", icon: LayoutDashboard },
  { label: "Mon profil public", href: "/compte/profil", icon: UserRound },
  { label: "Mes publications", href: "/compte/publications", icon: FileText },
  { label: "Mes alertes", href: "/compte/alertes", icon: Bell },
  { label: "Mon CV", href: "/compte/cv", icon: FileUser },
  { label: "Mes messages", href: "/compte/messages", icon: MessageSquare },
  { label: "Mes candidatures", href: "/compte/candidatures", icon: Send },
  { label: "Candidatures reçues", href: "/compte/candidatures-recues", icon: Inbox },
  { label: "Mes favoris", href: "/compte/favoris", icon: Heart },
  { label: "Sécurité", href: "/compte/securite", icon: ShieldCheck },
  { label: "Mes données", href: "/compte/donnees", icon: DatabaseBackup },
];

export function CompteSidebar({ name, meta }: { name: string; meta: string }) {
  const pathname = usePathname();
  return (
    <aside className="h-fit border border-line lg:sticky lg:top-4">
      <div className="flex items-center gap-3 border-b border-line bg-paper-2 p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent font-display font-black text-ink">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold leading-tight">{name}</p>
          {meta && <p className="text-xs text-muted">{meta}</p>}
        </div>
      </div>
      <nav className="p-2 text-sm">
        {MENU.map((m) => {
          const active = m.href === "/compte" ? pathname === "/compte" : pathname.startsWith(m.href);
          return (
            <Link
              key={m.href}
              href={m.href}
              className={`mb-0.5 flex items-center gap-2.5 whitespace-nowrap rounded px-3 py-2 font-semibold ${
                active ? "bg-primary text-white" : "text-ink-2 hover:bg-primary-faint hover:text-primary"
              }`}
            >
              <m.icon aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.2} />
              {m.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

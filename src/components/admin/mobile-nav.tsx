"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "./sidebar";

/* Nav admin mobile : bandeau horizontal défilant sous la topbar (< lg). */

export function AdminMobileNav({ only }: { only?: string[] }) {
  const pathname = usePathname();
  const nav = only ? ADMIN_NAV.filter((n) => only.includes(n.href)) : ADMIN_NAV;
  return (
    <nav className="border-b border-line bg-primary-darker lg:hidden">
      <div className="flex gap-1 overflow-x-auto px-3 py-2">
        {nav.map((n) => {
          const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded px-3 py-1.5 text-xs font-bold ${
                active ? "bg-accent text-ink" : "text-white/80 hover:bg-white/10"
              }`}
            >
              <n.icon aria-hidden className="h-3.5 w-3.5" />
              {n.label}
              {n.badge ? <span className="rounded-full bg-danger px-1.5 text-[0.6rem] text-white">{n.badge}</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

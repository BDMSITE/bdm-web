import Link from "next/link";
import { Search } from "lucide-react";
import type { ContentStatus, UserStatus, ContentType } from "@prisma/client";
import { CONTENT_LABEL } from "@/lib/routes";

/* Briques partagées du back-office. */

export function AdminTopbar() {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-line bg-paper px-6 py-3">
      <form action="/recherche" method="get" role="search" className="relative max-w-sm flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          name="q"
          placeholder="Rechercher sur le site…"
          aria-label="Rechercher sur le site"
          className="w-full rounded border border-line bg-paper-2 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
        />
      </form>
      <Link
        href="/"
        className="ml-auto rounded bg-primary px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-primary-dark lg:hidden"
      >
        Site
      </Link>
    </div>
  );
}

export function PageHead({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold">{title}</h1>
        {desc && <p className="mt-1 text-sm text-ink-2">{desc}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "danger" | "ok";
}) {
  const tones = {
    default: "border-line bg-paper",
    ok: "border-line bg-paper",
    warn: "border-accent bg-accent-light",
    danger: "border-danger bg-danger-light",
  } as const;
  const valueTones = {
    default: "text-primary",
    ok: "text-primary",
    warn: "text-ink",
    danger: "text-danger",
  } as const;
  return (
    <div className={`rounded border p-4 ${tones[tone]}`}>
      <span className={`font-display text-3xl font-extrabold ${valueTones[tone]}`}>{value}</span>
      <p className="mt-0.5 text-sm font-semibold text-ink">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "gray" | "green" | "yellow" | "red" | "blue";
  children: React.ReactNode;
}) {
  const tones = {
    gray: "bg-paper-2 text-ink-2 border border-line",
    green: "bg-primary-light text-primary-dark",
    yellow: "bg-accent-light text-ink",
    red: "bg-danger-light text-danger",
    blue: "bg-primary-light text-primary-dark",
  } as const;
  return (
    <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold ${tones[tone]}`}>{children}</span>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded border border-line bg-paper ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="font-bold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-ink-2">
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

export function TableShell({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-paper-2">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function RowActions({ items }: { items: string[] }) {
  return (
    <div className="flex flex-nowrap justify-end gap-2">
      {items.map((a) => (
        <button
          key={a}
          className={`whitespace-nowrap rounded px-2.5 py-1 text-xs font-bold ${
            a === "Valider"
              ? "bg-primary text-white hover:bg-primary-dark"
              : a === "Refuser" || a === "Bannir" || a === "Supprimer"
                ? "border border-danger text-danger hover:bg-danger hover:text-white"
                : "border border-line text-ink-2 hover:border-primary hover:text-primary"
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  );
}

export function FilterChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((f, i) => (
        <button
          key={f}
          className={
            i === 0
              ? "whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-bold text-white"
              : "whitespace-nowrap rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-ink-2 hover:border-primary hover:text-primary"
          }
        >
          {f}
        </button>
      ))}
    </div>
  );
}

/* ---------- Briques ajoutées avec le back-office réel ---------- */

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="px-4 py-8 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-prose text-sm text-muted">{children}</div>}
    </div>
  );
}

export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  DRAFT: "Brouillon",
  IN_MODERATION: "En modération",
  SCHEDULED: "Programmé",
  PUBLISHED: "En ligne",
  REJECTED: "Refusé",
  EXPIRED: "Expiré",
  ARCHIVED: "Archivé",
};

const CONTENT_STATUS_TONE: Record<ContentStatus, "gray" | "green" | "yellow" | "red" | "blue"> = {
  DRAFT: "gray",
  IN_MODERATION: "yellow",
  SCHEDULED: "blue",
  PUBLISHED: "green",
  REJECTED: "red",
  EXPIRED: "gray",
  ARCHIVED: "gray",
};

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return <Badge tone={CONTENT_STATUS_TONE[status]}>{CONTENT_STATUS_LABEL[status]}</Badge>;
}

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  PENDING_EMAIL: "E-mail à confirmer",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  DELETED: "Supprimé",
};

const USER_STATUS_TONE: Record<UserStatus, "gray" | "green" | "yellow" | "red" | "blue"> = {
  PENDING_EMAIL: "yellow",
  ACTIVE: "green",
  SUSPENDED: "red",
  DELETED: "gray",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge tone={USER_STATUS_TONE[status]}>{USER_STATUS_LABEL[status]}</Badge>;
}

export function TypeBadge({ type }: { type: ContentType }) {
  return <Badge tone="blue">{CONTENT_LABEL[type]}</Badge>;
}

export function fmtDate(d: Date | null | undefined) {
  return d ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

export function fmtDateTime(d: Date | null | undefined) {
  return d
    ? d.toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
}

export function fmtNumber(n: number) {
  return n.toLocaleString("fr-FR");
}

/* Libellés des actions du journal (AuditLog.action). */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "content.publish": "Publication",
  "content.reject": "Refus",
  "content.archive": "Archivage",
  "content.create": "Création",
  "user.suspend": "Suspension",
  "user.reactivate": "Réactivation",
  "keyword.create": "Mot-clé ajouté",
};

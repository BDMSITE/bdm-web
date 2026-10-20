import type { ContentStatus } from "@prisma/client";

/* Libellé et couleur de chaque statut, vus par le membre (liste + page d'édition). */

export const STATUS: Record<ContentStatus, { label: string; tone: string }> = {
  PUBLISHED: { label: "En ligne", tone: "bg-primary-light text-primary-dark" },
  IN_MODERATION: { label: "En modération", tone: "bg-accent-light text-ink" },
  DRAFT: { label: "Brouillon", tone: "border border-line bg-paper-2 text-ink-2" },
  SCHEDULED: { label: "Programmé", tone: "bg-accent-light text-ink" },
  REJECTED: { label: "Refusé", tone: "bg-danger-light text-danger" },
  EXPIRED: { label: "Expiré", tone: "border border-line bg-paper-2 text-ink-2" },
  ARCHIVED: { label: "Retiré", tone: "border border-line bg-paper-2 text-ink-2" },
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  const st = STATUS[status];
  return <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold ${st.tone}`}>{st.label}</span>;
}

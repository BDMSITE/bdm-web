import type { Consulate } from "@prisma/client";
import { CONSULATE_KIND_LABEL } from "@/lib/consulats";

/* Liste publique des représentations : coordonnées officielles telles que saisies par le HCBE. */

export function ConsulateList({ items, compact = false }: { items: Consulate[]; compact?: boolean }) {
  return (
    <ul className={compact ? "space-y-3" : "grid gap-4 sm:grid-cols-2"}>
      {items.map((c) => (
        <li key={c.id} className={`border border-line p-4 text-sm ${compact ? "" : "bg-paper"}`}>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">{CONSULATE_KIND_LABEL[c.kind] ?? c.kind} · {c.city}</p>
          <p className="mt-1 font-bold">{c.name}</p>
          {c.address && <p className="mt-1 text-ink-2">{c.address}</p>}
          <p className="mt-1 text-ink-2">
            {c.phone && <span className="mr-3">{c.phone}</span>}
            {c.email && <a href={`mailto:${c.email}`} className="mr-3 text-primary hover:underline">{c.email}</a>}
            {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Site officiel</a>}
          </p>
          {c.hours && <p className="mt-1 text-xs text-muted">{c.hours}</p>}
          {c.notes && <p className="mt-1 text-xs text-muted">{c.notes}</p>}
        </li>
      ))}
    </ul>
  );
}

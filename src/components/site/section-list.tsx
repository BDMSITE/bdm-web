import Link from "next/link";

/* Sections locales du HCBE : nom, présentation, contact par messagerie relais (jamais d'e-mail affiché). */

export type SectionItem = { id: string; name: string; country: string; city: string | null; description: string | null; website: string | null; contactProfile: { slug: string; displayName: string } | null };

export function SectionList({ items, compact = false }: { items: SectionItem[]; compact?: boolean }) {
  return (
    <ul className={compact ? "space-y-3" : "grid gap-4 sm:grid-cols-2"}>
      {items.map((s) => (
        <li key={s.id} className="border border-line p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">{[s.city, s.country].filter(Boolean).join(" · ")}</p>
          <p className="mt-1 font-bold">{s.name}</p>
          {s.description && <p className="mt-1 text-ink-2">{s.description}</p>}
          <p className="mt-2 flex flex-wrap gap-3">
            {s.contactProfile ? (
              <Link href={`/communaute/membres/${s.contactProfile.slug}#ecrire`} className="font-bold text-primary hover:underline">Écrire à la section</Link>
            ) : (
              <Link href="/contact?sujet=Question%20au%20HCBE" className="font-bold text-primary hover:underline">Écrire au HCBE</Link>
            )}
            {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Site ou page</a>}
          </p>
        </li>
      ))}
    </ul>
  );
}

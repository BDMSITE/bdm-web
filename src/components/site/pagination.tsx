import Link from "next/link";

/* Pagination des listes publiques : « Précédents / Suivants » + position, filtres conservés. */

export function pageParam(v: string | undefined) {
  return Math.max(1, Number(v ?? 1) || 1);
}

export function Pagination({ page, total, perPage, href }: { page: number; total: number; perPage: number; href: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const btn = "whitespace-nowrap rounded border-2 border-primary px-4 py-2 text-sm font-bold uppercase text-primary hover:bg-primary hover:text-white";
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
      {page > 1 ? <Link href={href(page - 1)} rel="prev" className={btn}>← Précédents</Link> : <span />}
      <p className="text-sm text-muted">
        {from}–{to} sur {total.toLocaleString("fr-FR")} · page {page} / {pages}
      </p>
      {page < pages ? <Link href={href(page + 1)} rel="next" className={btn}>Suivants →</Link> : <span />}
    </nav>
  );
}

/** Reconstruit l'URL d'une page de liste avec les filtres courants. */
export function pageHref(base: string, params: Record<string, string | undefined>) {
  return (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
    if (p > 1) u.set("page", String(p));
    else u.delete("page");
    const s = u.toString();
    return `${base}${s ? `?${s}` : ""}`;
  };
}

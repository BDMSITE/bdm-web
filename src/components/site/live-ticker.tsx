import Link from "next/link";
import { db } from "@/lib/db";
import { CONTENT_LABEL, contentHref } from "@/lib/routes";

/* Bandeau « En direct » : les derniers contenus publiés, rien d'autre.
   Masqué tant qu'il n'y a rien à annoncer. */

async function latest() {
  return db.content.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 8,
    select: { id: true, type: true, title: true, slug: true, city: true },
  });
}

function TickerItems({ items, hidden = false }: { items: Awaited<ReturnType<typeof latest>>; hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((it) => (
        <li key={it.id} className="flex items-center">
          <span aria-hidden className="mx-5 h-1.5 w-1.5 rounded-full bg-accent" />
          <Link
            href={contentHref(it.type, it.slug)}
            tabIndex={hidden ? -1 : undefined}
            className="whitespace-nowrap text-[0.8rem] font-semibold text-white/85 hover:text-accent"
          >
            {CONTENT_LABEL[it.type]} : {it.title}{it.city ? ` — ${it.city}` : ""}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export async function LiveTicker() {
  const items = await latest();
  if (items.length === 0) return null;
  return (
    <div className="bdm-ticker flex items-stretch overflow-hidden bg-primary-darker text-white">
      <span className="z-10 flex shrink-0 items-center gap-2 bg-accent px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-ink sm:px-4">
        <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        En direct
      </span>
      <div className="bdm-ticker-track items-center">
        <TickerItems items={items} />
        <TickerItems items={items} hidden />
      </div>
    </div>
  );
}

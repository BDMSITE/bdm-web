import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { clickHref } from "@/lib/pub-slots";

/* « Nos partenaires » : bande pleine largeur sur l'accueil. Alimentée par les
   campagnes maison de la régie (un partenaire = un annonceur « maison » en
   diffusion), donc gérée depuis /admin/regie sans table supplémentaire. */

export async function PartnersBand() {
  const now = new Date();
  const rows = await db.banner.findMany({
    where: { house: true, status: "PUBLISHED", startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    orderBy: [{ advertiser: "asc" }, { slot: "asc" }],
    select: { id: true, advertiser: true, image: true, tagline: true, headline: true, link: true, bg: true },
  });
  const partners = [...new Map(rows.map((r) => [r.advertiser, r])).values()];
  if (partners.length === 0) return null;

  return (
    <section className="border-y-2 border-line bg-paper-2" aria-labelledby="partenaires-titre">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Ils avancent avec nous</p>
            <h2 id="partenaires-titre" className="section-title mt-1 text-2xl text-ink sm:text-3xl">
              Nos <em>partenaires</em>
            </h2>
          </div>
          <Link href="/annonceurs" className="whitespace-nowrap bg-accent px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-ink hover:bg-accent-dark">
            Devenir partenaire →
          </Link>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {partners.map((p) => (
            <li key={p.id}>
              <a
                href={clickHref(p.id)}
                target="_blank"
                rel="noopener sponsored"
                className="group flex h-full flex-col border border-line bg-paper p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_14px_30px_-18px_rgba(0,0,0,.4)]"
              >
                <span className="flex h-24 items-center justify-center" style={{ background: "transparent" }}>
                  {p.image ? (
                    <Image src={p.image} alt={p.advertiser} width={160} height={96} unoptimized className="max-h-24 w-auto object-contain" />
                  ) : (
                    <span className="font-display text-xl font-extrabold">{p.advertiser}</span>
                  )}
                </span>
                <span className="mt-4 border-t border-line pt-4">
                  <span className="block font-display text-lg font-extrabold leading-tight text-ink group-hover:text-primary">{p.advertiser}</span>
                  {p.tagline && <span className="mt-1 line-clamp-2 block text-sm text-ink-2">{p.tagline}</span>}
                </span>
                <span className="mt-auto pt-4 text-xs font-extrabold uppercase tracking-wide text-primary">Visiter le site →</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

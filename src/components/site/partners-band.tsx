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
    select: { id: true, advertiser: true, image: true },
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

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {partners.map((p) => (
            <li key={p.id}>
              <a
                href={clickHref(p.id)}
                target="_blank"
                rel="noopener sponsored"
                className="group flex h-full flex-col items-center justify-center gap-4 border border-line bg-paper px-6 py-8 text-center transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_14px_30px_-18px_rgba(0,0,0,.4)]"
              >
                <span className="flex h-24 w-full items-center justify-center">
                  {p.image ? (
                    <Image src={p.image} alt="" width={200} height={96} unoptimized className="max-h-24 w-auto max-w-[170px] object-contain" />
                  ) : (
                    <span className="font-display text-xl font-extrabold">{p.advertiser}</span>
                  )}
                </span>
                <span className="font-display text-base font-extrabold leading-tight text-ink group-hover:text-primary">{p.advertiser}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

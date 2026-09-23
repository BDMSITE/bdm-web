import Link from "next/link";

/* Bandeau « diaspora en direct » sous la navigation : dernières activités du
   réseau en défilement continu. Données d'exemple — alimenté par la base (S5)
   et piloté depuis l'admin (En direct). */

const ITEMS: { text: string; href: string }[] = [
  { text: "Nouvelle offre : Développeur full-stack h/f — Cotonou", href: "/emploi/offre-exemple" },
  { text: "Awa M. vient de rejoindre le réseau depuis Montréal", href: "/communaute/membres" },
  { text: "Pique-nique des Béninois d'Île-de-France — dans 3 jours", href: "/agenda" },
  { text: "Nouvelle bonne adresse : Chez Maman Bénin — Paris 18e", href: "/adresses" },
  { text: "312 membres à Cotonou — voir la carte de la diaspora", href: "/" },
  { text: "Article membre publié : Le vodun expliqué à mes enfants", href: "/magazine/article-exemple" },
];

function TickerItems({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {ITEMS.map((it) => (
        <li key={it.text} className="flex items-center">
          <span aria-hidden className="mx-5 h-1.5 w-1.5 rounded-full bg-accent" />
          <Link
            href={it.href}
            tabIndex={hidden ? -1 : undefined}
            className="whitespace-nowrap text-[0.8rem] font-semibold text-white/85 hover:text-accent"
          >
            {it.text}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function LiveTicker() {
  return (
    <div className="bdm-ticker flex items-stretch overflow-hidden bg-primary-darker text-white">
      <span className="z-10 flex shrink-0 items-center gap-2 bg-accent px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-ink sm:px-4">
        <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        En direct
      </span>
      <div className="bdm-ticker-track items-center">
        <TickerItems />
        <TickerItems hidden />
      </div>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Bell, BriefcaseBusiness, CircleUserRound, LogOut, ShieldCheck, Music2, MessageCircle, MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logoutAction } from "@/lib/actions/auth";
import { NAV } from "./nav-data";
import { StickyBar, Crumbs, MobileMenu } from "./header-extras";
import { MapBand } from "./map-band";
import { LiveTicker } from "./live-ticker";
import { LogoWord } from "./logo-word";
import { AdSlot } from "./ad-slot";
export { AdSlot } from "./ad-slot";
import { mapData, siteCounts } from "@/lib/content";
import { slugify } from "@/lib/slug";
import { keywordHref } from "@/lib/routes";
import { socialLinks } from "@/lib/settings";

/* Composants de structure partagés par toutes les pages publiques. */

export { NAV };

const STAFF = new Set(["EDITOR", "MODERATOR", "ADMIN"]);

export async function SiteHeader({ mapDefaultOpen = false }: { mapDefaultOpen?: boolean }) {
  const socials = await socialLinks();
  const [session, carte, counts] = await Promise.all([auth(), mapData(), siteCounts()]);
  const user = session?.user ?? null;
  const nonLus = user ? await db.message.count({ where: { toUserId: user.id, readAt: null } }).catch(() => 0) : 0;
  const isStaff = STAFF.has(user?.role ?? "");

  return (
    <>
      <a href="#contenu" className="skip-link">Aller au contenu</a>
      <StickyBar />
      <header className="border-b border-line bg-paper">
        {/* Rangée haute claire façon modèle : recherche · logo centré · réseaux + connexion */}
        <div className="flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr] md:py-6">
          <form action="/recherche" className="hidden md:flex">
            <input
              type="search"
              name="q"
              aria-label="Rechercher sur le site"
              placeholder="Recherchez sur le site"
              className="h-11 w-52 border border-line bg-paper px-4 text-sm shadow-[0_2px_4px_rgba(0,0,0,0.12)] focus:border-primary focus:outline-none lg:w-60"
            />
            <button className="h-11 bg-primary px-4 text-xs font-extrabold uppercase text-white hover:bg-primary-dark">
              Ok
            </button>
          </form>

          <Link href="/" className="min-w-0 text-center md:justify-self-center">
            <span className="block font-display text-[1.7rem] font-extrabold leading-none text-primary-darker sm:text-4xl">
              Béninois
            </span>
            <LogoWord className="block font-script text-[1.45rem] leading-none text-primary sm:text-[1.8rem]" />
          </Link>

          <div className="flex items-center justify-end gap-4 lg:gap-5">
            <ul className="hidden items-center gap-2.5 lg:flex">
              {socials.filter((s) => ["facebook", "linkedin", "instagram"].includes(s.key)).map((s) => (
                <li key={s.label}>
                  <a
                    href={s.url || "/contact"}
                    target={s.url ? "_blank" : undefined}
                    rel={s.url ? "noopener" : undefined}
                    title={s.url ? s.label : `${s.label} : page en cours d'ouverture, écrivez-nous`}
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark"
                  >
                    {ICONS[s.key]?.({})}
                  </a>
                </li>
              ))}
            </ul>
            {user ? (
              <div className="hidden items-center gap-3 md:flex">
                <Link
                  href="/compte"
                  className="flex items-center gap-2 text-sm font-semibold text-ink-2 hover:text-primary"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light font-display text-sm font-bold text-primary-dark">
                    {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[9rem] truncate">{user.name ?? "Mon espace"}</span>
                </Link>
                {nonLus > 0 && (
                  <Link href="/compte/messages" aria-label={`${nonLus} message${nonLus > 1 ? "s" : ""} non lu${nonLus > 1 ? "s" : ""}`} title="Messages non lus" className="relative text-muted hover:text-primary">
                    <MessageSquare aria-hidden className="h-5 w-5" />
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{nonLus > 9 ? "9+" : nonLus}</span>
                  </Link>
                )}
                {isStaff && (
                  <Link href="/admin" aria-label="Administration" title="Administration" className="text-muted hover:text-primary">
                    <ShieldCheck aria-hidden className="h-5 w-5" />
                  </Link>
                )}
                <form action={logoutAction}>
                  <button aria-label="Se déconnecter" title="Se déconnecter" className="text-muted hover:text-primary">
                    <LogOut aria-hidden className="h-5 w-5" />
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/connexion"
                className="hidden items-center gap-2 text-sm font-semibold text-ink-2 hover:text-primary md:flex"
              >
                <CircleUserRound aria-hidden className="h-6 w-6 text-muted" />
                Se connecter
              </Link>
            )}
            <Link
              href="/publier"
              className="hidden rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark md:inline-block"
            >
              Publier
            </Link>
            <MobileMenu user={user ? { name: user.name ?? null, staff: isStaff } : null} />
          </div>
        </div>

        {/* Barre de navigation verte, bloc « Emploi & Stages » jaune décalé à gauche */}
        <nav className="hidden bg-primary md:block">
          <div className="flex w-full items-stretch">
            <Link
              href="/emploi"
              className="flex items-center gap-2.5 whitespace-nowrap bg-accent px-5 text-[1.02rem] font-extrabold uppercase tracking-wide text-ink hover:bg-accent-dark"
            >
              <BriefcaseBusiness aria-hidden className="h-[1.15rem] w-[1.15rem]" />
              Emploi & stages
            </Link>
            <ul className="flex flex-1 items-stretch justify-center">
              {NAV.filter((n) => n.href !== "/emploi").map((n) => (
                <li key={n.href} className="flex">
                  <Link
                    href={n.href}
                    className="flex h-11 items-center whitespace-nowrap px-4 text-sm font-extrabold uppercase tracking-wide text-white hover:bg-primary-dark lg:px-5"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <LiveTicker />

        <Crumbs />
      </header>
      <span id="contenu" tabIndex={-1} />

      {/* Carte : ouverte sur l'accueil, repliée ailleurs */}
      <MapBand defaultOpen={mapDefaultOpen} data={carte} membres={counts.members} pays={counts.countries} />
    </>
  );
}

/* Icônes de marques (retirées de Lucide) — SVG inline, chemins simple-icons. */
type BrandProps = React.SVGProps<SVGSVGElement>;
const ICONS: Record<string, (p: BrandProps) => React.JSX.Element> = {
  get facebook() { return Fb; }, get linkedin() { return Li; }, get instagram() { return Ig; }, get x() { return Xx; }, get youtube() { return Yt; },
  tiktok: (p: BrandProps) => <Music2 aria-hidden className={p.className ?? "h-4 w-4"} />,
  whatsapp: (p: BrandProps) => <MessageCircle aria-hidden className={p.className ?? "h-4 w-4"} />,
};

const Fb = (p: BrandProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden {...p}>
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07Z" />
  </svg>
);
const Li = (p: BrandProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden {...p}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45Z" />
  </svg>
);
const Ig = (p: BrandProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden {...p}>
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38A5.9 5.9 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z" />
  </svg>
);
const Xx = (p: BrandProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden {...p}>
    <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3L17.61 20.65Z" />
  </svg>
);
const Yt = (p: BrandProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden {...p}>
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
  </svg>
);

const SITEMAP: { title: string; href: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Magazine",
    href: "/magazine",
    links: [
      { label: "Portraits", href: "/magazine" },
      { label: "Béninois qui comptent", href: "/magazine/beninois-qui-comptent" },
      { label: "Actualités", href: "/magazine" },
      { label: "Retour au pays", href: "/retour-au-pays" },
    ],
  },
  {
    title: "Communauté",
    href: "/communaute",
    links: [
      { label: "Membres", href: "/communaute/membres" },
      { label: "Entreprises", href: "/communaute/entreprises" },
      { label: "Associations", href: "/communaute/associations" },
      { label: "Artistes / groupes", href: "/communaute/artistes" },
      { label: "Compétences de la diaspora", href: "/communaute/competences" },
      { label: "La diaspora par pays", href: "/pays" },
      { label: "Articles membres", href: "/magazine" },
    ],
  },
  {
    title: "Emploi & stages",
    href: "/emploi",
    links: [
      { label: "Offres d'emploi", href: "/emploi" },
      { label: "Espace recruteur", href: "/emploi/recruteurs" },
      { label: "Déposer une offre", href: "/publier" },
    ],
  },
  { title: "Bonnes adresses", href: "/adresses", links: [] },
  { title: "Agenda", href: "/agenda", links: [] },
  { title: "Bons plans", href: "/bons-plans", links: [] },
  {
    title: "Pratique",
    href: "/annonces",
    links: [
      { label: "Alertes / notifications", href: "/compte" },
      { label: "Petites annonces", href: "/annonces" },
      { label: "Chercher / trouver", href: "/pratique/chercher-trouver" },
      { label: "Guides de démarches", href: "/pratique/demarches" },
      { label: "Accueil & hébergement", href: "/pratique/accueil" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "Mémoire & racines", href: "/memoire" },
    ],
  },
];

/* Bas de page façon modèle : bannière pub + photo panoramique pleine largeur
   qui plonge dans le footer. Visuel fourni par Josué (27/10/2026) : fresque
   murale de la diaspora, image générée, bande 3840×1440. Pas de crédit requis. */
function BottomPageBox() {
  return (
    <div className="relative">
      <div className="relative z-10 mx-auto hidden max-w-[1002px] px-4 md:block">
        <AdSlot slot="BOTTOM" />
      </div>
      <div className="relative h-[200px] w-full md:-mt-24 md:h-[420px]">
        <Image
          src="/images/fresque-diaspora.jpg"
          alt="Fresque murale : des femmes et des hommes de la diaspora, bras dessus bras dessous, devant un globe tenu par un poing aux couleurs de l'Afrique"
          fill
          sizes="100vw"
          quality={80}
          className="object-cover object-[50%_45%]"
        />
      </div>
    </div>
  );
}

export async function SiteFooter() {
  const socials = await socialLinks();
  return (
    <footer className="mt-16">
      <BottomPageBox />
      <div className="wax-bg-soft bg-primary-darker text-white">
      <div className="w-full px-6 pb-10 pt-14 lg:px-10">
        {/* Rangée 1 : identité | plan du site */}
        <div className="grid gap-12 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
          <div>
            <Link href="/" className="inline-block">
              <span className="block font-display text-[1.6rem] font-extrabold leading-none">
                Béninois
              </span>
              <span className="block font-script text-[1.5rem] leading-none text-accent">
                du Monde
              </span>
              <span className="mt-2 block text-[0.65rem] uppercase tracking-[0.25em] text-white/45">
                Le réseau de la diaspora béninoise
              </span>
            </Link>

            <ul className="mt-7 flex items-center gap-3">
              {socials.filter((s) => !["tiktok", "whatsapp"].includes(s.key) || s.url).map((s) => (
                <li key={s.label}>
                  <a
                    href={s.url || "/contact"}
                    target={s.url ? "_blank" : undefined}
                    rel={s.url ? "noopener" : undefined}
                    title={s.url ? s.label : `${s.label} : page en cours d'ouverture, écrivez-nous`}
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 transition-colors hover:bg-accent hover:text-ink"
                  >
                    {ICONS[s.key]?.({})}
                  </a>
                </li>
              ))}
            </ul>

            <Link
              href="/compte/alertes"
              className="mt-6 inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-accent-dark"
            >
              <Bell aria-hidden className="h-4 w-4" /> Gérer mes alertes
            </Link>
          </div>

          <nav
            aria-label="Plan du site"
            className="hidden flex-wrap gap-x-12 gap-y-10 sm:flex"
          >
            {SITEMAP.map((col) => (
              <div key={col.title}>
                <Link
                  href={col.href}
                  className="inline-block whitespace-nowrap border-b-2 border-accent pb-1.5 text-[0.8rem] font-bold uppercase tracking-[0.12em] text-white hover:text-accent"
                >
                  {col.title}
                </Link>
                {col.links.length > 0 && (
                  <ul className="mt-4 space-y-2.5 text-[0.9rem] leading-snug">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          className="whitespace-nowrap text-white/65 transition-colors hover:text-accent"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Séparateur */}
        <div className="my-10 h-px w-full bg-white/10" />

        {/* Rangée 2 : partenaires | liens institutionnels */}
        <div className="grid items-start gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-accent">Partenaire officiel</p>
            <Link href="/hcbe" className="mt-3 inline-block bg-white p-3 transition hover:bg-paper-2" aria-label="Le HCBE, partenaire officiel de Béninois du Monde">
              <Image src="/images/logo-hcbe.png" alt="Haut Conseil des Béninois de l'Extérieur" width={240} height={85} className="h-auto w-[240px]" />
            </Link>
            <p className="mt-3 max-w-[280px] text-xs leading-relaxed text-white/55">
              Le Haut Conseil des Béninois de l&apos;Extérieur, partenaire officiel de Béninois du Monde.
            </p>
          </div>

          <div>
            <ul className="flex flex-wrap gap-x-9 gap-y-3 text-[0.9rem] font-semibold">
              {[
                { label: "Contact", href: "/contact" },
                { label: "Newsletter", href: "/newsletter" },
                { label: "Annonceurs", href: "/annonceurs" },
                { label: "Espace recruteur", href: "/emploi/recruteurs" },
                { label: "Le HCBE", href: "/hcbe" },
                { label: "Mentions légales", href: "/legal/mentions-legales" },
                { label: "Confidentialité", href: "/legal/confidentialite" },
                { label: "CGU", href: "/legal/cgu" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="whitespace-nowrap text-white/80 transition-colors hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs tracking-wide text-white/40">
              © 2026 Béninois du Monde — HCBE. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
      </div>
      <div className="tricolor" aria-hidden />
    </footer>
  );
}

export function SectionTitle({ pre, em, href }: { pre: string; em: string; href?: string }) {
  return (
    <div className="mb-5 flex items-baseline justify-between border-b-2 border-line pb-2">
      <h2 className="section-title text-lg text-ink">
        {pre} <em>{em}</em>
      </h2>
      {href && (
        <Link href={href} className="whitespace-nowrap text-sm font-semibold text-primary hover:underline">
          Tout voir →
        </Link>
      )}
    </div>
  );
}

export function AlertsBox({ keywords = [] }: { keywords?: string[] }) {
  return (
    <div className="border-2 border-primary p-4">
      <h3 className="section-title text-sm">
        Gérer mes <em>alertes</em>
      </h3>
      <p className="mt-2 text-sm text-ink-2">
        Recevez par e-mail les offres, articles et événements qui correspondent à vos mots-clés.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 empty:hidden">
        {keywords.map((k) => (
          <span
            key={k}
            className="whitespace-nowrap rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark"
          >
            {k}
          </span>
        ))}
      </div>
      <Link href="/compte/alertes" className="mt-4 block w-full rounded bg-primary py-2 text-center text-sm font-bold text-white hover:bg-primary-dark">
        Créer une alerte
      </Link>
    </div>
  );
}

export function KeywordChips({ keywords }: { keywords: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((k) => (
        <Link
          key={k}
          href={keywordHref(slugify(k))}
          className="whitespace-nowrap rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark hover:bg-primary hover:text-white"
        >
          {k}
        </Link>
      ))}
    </div>
  );
}

/* Commutateur FR | EN pour les rubriques traduites (Racines / Roots).
   Posé sur fond vert profond (bandeau de rubrique). */
export function LangSwitch({ fr, en, current }: { fr: string; en: string; current: "fr" | "en" }) {
  const on = "bg-accent px-3 py-1.5 text-ink";
  const off = "px-3 py-1.5 text-white/85 hover:text-accent";
  return (
    <span className="inline-flex items-center overflow-hidden rounded border-2 border-white/50 text-xs font-extrabold uppercase tracking-wide">
      <Link href={fr} lang="fr" aria-current={current === "fr" ? "page" : undefined} className={current === "fr" ? on : off}>
        FR
      </Link>
      <Link href={en} lang="en" aria-current={current === "en" ? "page" : undefined} className={current === "en" ? on : off}>
        EN
      </Link>
    </span>
  );
}

/* Bandeau de rubrique vert profond, partagé par les pages de section. */
export function PageBanner({
  pre,
  em,
  desc,
  children,
}: {
  pre: string;
  em: string;
  desc: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="wax-bg bg-primary-darker py-8 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="section-title text-2xl md:text-3xl">
          {pre} <em className="!text-accent">{em}</em>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">{desc}</p>
        {children && <div className="mt-4 flex flex-wrap gap-3">{children}</div>}
      </div>
    </div>
  );
}

/* Barre filtres standard sous le bandeau (CDC §7.1). */
export function FilterBar({
  placeholder,
  selects,
}: {
  placeholder: string;
  selects: { label: string; options: string[] }[];
}) {
  return (
    <div className="border-b border-line bg-paper-2">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
        <input
          type="search"
          placeholder={placeholder}
          className="w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none sm:w-64"
        />
        {selects.map((s) => (
          <select
            key={s.label}
            aria-label={s.label}
            className="rounded border border-line bg-paper px-3 py-2 text-sm"
          >
            {s.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ))}
        <button className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
          Rechercher
        </button>
        <button className="ml-auto whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline">
          Voir sur la carte
        </button>
      </div>
    </div>
  );
}

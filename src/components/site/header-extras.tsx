"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Menu, X } from "lucide-react";
import { NAV } from "./nav-data";
import { logoutAction } from "@/lib/actions/auth";

/* Barre sticky compacte : apparaît après 280 px de défilement (proposition 1). */

export function StickyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 top-0 z-40 bg-primary-darker text-white shadow-md transition-transform duration-200 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="flex h-12 w-full items-center gap-7 px-6">
        <Link href="/" className="shrink-0 font-display text-lg font-extrabold leading-none">
          Béninois<span className="font-script text-xl font-semibold text-accent"> du Monde</span>
        </Link>
        <nav className="hidden flex-1 items-center gap-6 text-[0.78rem] font-bold uppercase tracking-wide lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap text-white/85 hover:text-accent">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-4">
          <Link href="/recherche" aria-label="Rechercher" className="text-white/80 hover:text-accent">
            <Search aria-hidden className="h-4.5 w-4.5" />
          </Link>
          <Link
            href="/publier"
            className="whitespace-nowrap rounded bg-accent px-4 py-1.5 text-[0.8rem] font-bold text-ink hover:bg-accent-dark"
          >
            Publier
          </Link>
        </div>
      </div>
    </div>
  );
}

/* Fil d'Ariane systématique sous la navigation (proposition 3). */

const LABELS: Record<string, string> = {
  emploi: "Emploi & stages",
  "offre-exemple": "Développeur full-stack h/f",
  recruteurs: "Espace recruteur",
  magazine: "Magazine",
  "article-exemple": "Retour à Cotonou",
  "beninois-qui-comptent": "Béninois qui comptent",
  "retour-au-pays": "Retour au pays",
  communaute: "Communauté",
  membres: "Membres",
  "aichatou-s": "Aïchatou S.",
  associations: "Associations",
  entreprises: "Entreprises",
  artistes: "Artistes & groupes",
  adresses: "Bonnes adresses",
  "adresse-exemple": "Chez Maman Bénin",
  agenda: "Agenda",
  "evenement-exemple": "Pique-nique des Béninois d'IDF",
  avantages: "Bons plans",
  annonces: "Petites annonces",
  pratique: "Pratique",
  "chercher-trouver": "Chercher / trouver",
  accueil: "Accueil & hébergement",
  memoire: "Mémoire & racines",
  hcbe: "Le HCBE",
  annonceurs: "Annonceurs",
  mot: "Mot-clé",
  exemple: "Retour au pays",
  recherche: "Recherche",
  publier: "Publier",
  connexion: "Connexion",
  contact: "Contact",
  compte: "Mon espace",
  profil: "Mon profil public",
  publications: "Mes publications",
  alertes: "Mes alertes",
  cv: "Mon CV",
  candidatures: "Mes candidatures",
  favoris: "Mes favoris",
  securite: "Sécurité",
  donnees: "Mes données",
  legal: "Informations légales",
  "mentions-legales": "Mentions légales",
  confidentialite: "Confidentialité",
  cgu: "CGU",
  inscription: "Créer un compte",
  "pme-fintech": "PME Fintech",
  "benin-diaspora-idf": "Bénin Diaspora IDF",
  "gangbe-brass": "Gangbé Brass Band",
  "annonce-exemple": "Billet Paris–Cotonou",
  "angelique-kidjo": "Angélique Kidjo",
  competences: "Compétences de la diaspora",
  messages: "Mes messages",
  "candidatures-recues": "Candidatures reçues",
  modifier: "Modifier",
  "les-agudas": "Les Agudas",
  en: "English",
  roots: "Roots",
};

function labelFor(seg: string) {
  if (LABELS[seg]) return LABELS[seg];
  const s = decodeURIComponent(seg).replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function Crumbs() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/admin")) return null;

  const parts = pathname.split("/").filter(Boolean);
  // /legal est un segment sans page propre : on ne le rend pas cliquable
  const crumbs = parts.map((seg, i) => ({
    seg,
    label: labelFor(seg),
    href: "/" + parts.slice(0, i + 1).join("/"),
    clickable: !(seg === "legal" || seg === "mot" || seg === "pratique" || seg === "en"),
  }));

  return (
    <nav aria-label="Fil d'Ariane" className="border-b border-line bg-paper-2">
      <ol className="flex w-full flex-wrap items-center gap-x-2 gap-y-0.5 px-6 py-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
        <li>
          <Link href="/" className="whitespace-nowrap hover:text-primary">Accueil</Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-x-2">
            <span aria-hidden>›</span>
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="whitespace-nowrap font-bold text-primary">{c.label}</span>
            ) : c.clickable ? (
              <Link href={c.href} className="whitespace-nowrap hover:text-primary">{c.label}</Link>
            ) : (
              <span className="whitespace-nowrap">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}


/* Menu mobile plein écran (burger) — nav complète + recherche + actions. */

export function MobileMenu({ user }: { user: { name: string | null; staff: boolean } | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-2 rounded border border-line px-3 py-2 text-sm font-semibold text-ink-2 hover:border-primary hover:text-primary md:hidden"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
      >
        <Menu aria-hidden className="h-5 w-5" /> Menu
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 right-0 flex w-[300px] max-w-[85vw] flex-col bg-primary-darker text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="font-display text-lg font-extrabold">
                Béninois<span className="font-script text-xl font-semibold text-accent"> du Monde</span>
              </span>
              <button onClick={() => setOpen(false)} aria-label="Fermer le menu" className="text-white/80 hover:text-accent">
                <X aria-hidden className="h-6 w-6" />
              </button>
            </div>

            <form action="/recherche" className="border-b border-white/10 p-4">
              <input
                type="search"
                name="q"
                placeholder="Rechercher sur le site…"
                className="w-full rounded-md border border-white/25 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-accent focus:outline-none"
              />
            </form>

            <nav className="flex-1 overflow-y-auto p-3">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={close}
                  className="block rounded px-3 py-3 text-[0.95rem] font-bold uppercase tracking-wide text-white/85 hover:bg-white/10 hover:text-accent"
                >
                  {n.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-white/10" />
              {[
                { label: "Mémoire & racines", href: "/memoire" },
                { label: "Le HCBE", href: "/hcbe" },
                { label: "Contact", href: "/contact" },
              ].map((n) => (
                <Link key={n.href} href={n.href} onClick={close} className="block rounded px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-accent">
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="space-y-2.5 border-t border-white/10 p-4">
              <Link href="/publier" onClick={close} className="block rounded bg-accent py-2.5 text-center text-sm font-bold text-ink hover:bg-accent-dark">
                Publier
              </Link>
              {user ? (
                <>
                  <Link href="/compte" onClick={close} className="block truncate rounded border border-white/30 py-2.5 text-center text-sm font-bold text-white/90 hover:border-accent hover:text-accent">
                    {user.name ?? "Mon espace"}
                  </Link>
                  {user.staff && (
                    <Link href="/admin" onClick={close} className="block rounded border border-white/30 py-2.5 text-center text-sm font-bold text-white/90 hover:border-accent hover:text-accent">
                      Administration
                    </Link>
                  )}
                  <form action={logoutAction}>
                    <button className="w-full rounded py-2 text-center text-sm font-semibold text-white/60 hover:text-accent">
                      Se déconnecter
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/connexion" onClick={close} className="block rounded border border-white/30 py-2.5 text-center text-sm font-bold text-white/90 hover:border-accent hover:text-accent">
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

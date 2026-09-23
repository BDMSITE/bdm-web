import Link from "next/link";
import type { Metadata } from "next";
import {
  SiteHeader,
  SiteFooter,
  SectionTitle,
  AdSlot,
  AlertsBox,
  KeywordChips,
} from "@/components/site/chrome";

export const metadata: Metadata = {
  title: "Les Agudas : ces Afro-Brésiliens revenus au Bénin il y a deux siècles",
};

/* MAQUETTE — Grand récit mémoire (rubrique Racines), contenu d'exemple
   à faire valider historiquement avant publication réelle. */

const LIES = [
  "Devenir Béninois·e : le guide de la nationalité afrodescendante",
  "Ouidah, la Route de l'Esclave pas à pas",
  "Le vodun expliqué à mes enfants nés en France",
];

export default function AgudasPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="min-w-0">
            <span className="mt-4 inline-block bg-accent px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink">
              Grand récit
            </span>
            <h1 className="font-display mt-3 text-3xl font-black leading-tight md:text-4xl">
              Les Agudas : ces Afro-Brésiliens revenus au Bénin il y a deux siècles
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-ink-2">
              Bien avant les lois sur le retour, des milliers d&apos;anciens captifs et leurs
              descendants ont quitté Bahia pour reconstruire leur vie à Ouidah, Porto-Novo et
              Agoué. On les appelle les Agudas — et leur histoire est la preuve vivante que le
              chemin du retour existe.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-line py-3 text-sm text-muted">
              <span>
                Par <strong className="text-ink">La Rédaction</strong>
              </span>
              <span>Publié le 23 septembre 2026</span>
              <span className="card-location">Ouidah · Bénin</span>
              <button className="ml-auto font-bold text-primary hover:underline">Partager</button>
            </div>

            <figure className="mt-6">
              <div className="flex aspect-video items-center justify-center border border-line bg-paper-2 text-sm text-muted">
                photo à la une
              </div>
              <figcaption className="mt-2 text-xs text-muted">
                Maison de style afro-brésilien à Porto-Novo. Crédit : exemple.
              </figcaption>
            </figure>

            <div className="prose-bdm mt-6 space-y-5 text-[1.05rem] leading-relaxed text-ink">
              <p>
                <strong>Tout commence par un aller forcé.</strong> Entre le XVIIᵉ et le XIXᵉ
                siècle, des centaines de milliers de captifs partent des côtes de l&apos;actuel
                Bénin vers le Brésil. Mais dès les années 1830, le mouvement s&apos;inverse :
                des affranchis de Bahia, parfois expulsés après des révoltes, parfois par choix,
                embarquent pour revenir sur la terre de leurs ancêtres.
              </p>
              <p>
                À Ouidah, Agoué et Porto-Novo, ces « Brésiliens » — Agudas, du nom que leur
                donnent les populations locales — apportent des métiers, une architecture, une
                cuisine et des fêtes. Maçons, charpentiers, commerçants, ils bâtissent des maisons
                à véranda et des façades ornées qui marquent encore les villes du Sud.
              </p>
              <blockquote className="border-l-4 border-accent bg-accent-light p-4 font-display text-xl font-bold leading-snug">
                Revenus sans rien ou presque, les Agudas ont fait souche : leurs noms — Paraíso,
                d&apos;Almeida, da Silva — se lisent aujourd&apos;hui sur les plaques des rues et
                les listes électorales du Bénin.
              </blockquote>
              <p>
                Leur héritage se célèbre toujours : la fête du Bourian et ses masques carnavalesques,
                les plats hérités de Bahia, les familles qui gardent la mémoire du voyage. Une
                mémoire double — celle de la déportation, et celle du retour réussi.
              </p>
              <p>
                Pour les afrodescendants d&apos;aujourd&apos;hui, qui peuvent désormais demander la
                nationalité béninoise, les Agudas sont un précédent et un message : on peut
                revenir, refaire sa vie, et enrichir le pays de ce qu&apos;on a appris ailleurs.
                Le Bénin l&apos;a déjà vécu.
              </p>
            </div>

            <div className="mt-8 space-y-6 border-t border-line pt-6">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                  Mots-clés
                </p>
                <KeywordChips keywords={["Agudas", "Ouidah", "Porto-Novo", "Brésil", "Mémoire", "Afrodescendants"]} />
              </div>

              <div className="border-2 border-primary p-4 text-center">
                <p className="font-display text-lg font-bold">
                  Vous êtes afrodescendant·e et pensez au Bénin ?
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  Guides, lieux de mémoire et accompagnement dans la rubrique Racines.
                </p>
                <Link
                  href="/memoire"
                  className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark"
                >
                  Explorer Mémoire & racines
                </Link>
              </div>
            </div>

            <section className="mt-10">
              <SectionTitle pre="À lire" em="aussi" />
              <div className="grid gap-5 sm:grid-cols-3">
                {LIES.map((t) => (
                  <article key={t}>
                    <div className="mb-2 aspect-[4/3] border border-line bg-paper-2" />
                    <h3 className="font-bold leading-snug">
                      <Link href="/memoire" className="hover:text-primary">
                        {t}
                      </Link>
                    </h3>
                  </article>
                ))}
              </div>
            </section>
          </article>

          <aside className="space-y-8">
            <AdSlot label="pavé latéral" />
            <AlertsBox keywords={["Mémoire", "Afrodescendants", "Ouidah"]} />
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

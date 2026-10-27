import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, AdSlot } from "@/components/site/chrome";
import { auth } from "@/lib/auth";
import { PublierForm } from "./form";

export const metadata: Metadata = { title: "Publier sur Béninois du Monde" };

/* Guichet « Publier » (CDC §7.1). Connecté : formulaire réel (contenu créé en
   modération). Non connecté : explication des étapes et bouton de connexion. */

const ETAPES = [
  { t: "Je me connecte", d: "Compte gratuit : membre, entreprise, association ou artiste." },
  { t: "Je remplis le formulaire", d: "Type de contenu, titre, texte, lieu et mots-clés." },
  { t: "La modération relit", d: "Rien n'est mis en ligne sans relecture par l'équipe." },
  { t: "En ligne", d: "Votre contenu apparaît dans sa rubrique et sur la carte." },
];

export default async function PublierPage() {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <>
      <SiteHeader />

      <div className="wax-bg bg-primary-darker py-8 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="section-title text-2xl md:text-3xl">
            Publier sur <em className="!text-accent">Béninois du Monde</em>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Membres, entreprises, associations et artistes publient directement leurs articles, offres, événements,
            adresses et annonces. Chaque contenu est relu par la modération avant mise en ligne.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            {user ? (
              <PublierForm />
            ) : (
              <>
                <h2 className="section-title mb-5 border-b-2 border-line pb-2 text-lg">
                  Comment ça <em>marche ?</em>
                </h2>
                <ol className="grid gap-4 sm:grid-cols-2">
                  {ETAPES.map((e, i) => (
                    <li key={e.t} className="border border-line p-5">
                      <span className="font-display text-3xl font-black text-line">{i + 1}</span>
                      <h3 className="mt-1 font-bold">{e.t}</h3>
                      <p className="mt-1 text-sm text-ink-2">{e.d}</p>
                    </li>
                  ))}
                </ol>
                <div className="mt-8 border-2 border-primary p-6 text-center">
                  <p className="font-display text-lg font-bold">Connectez-vous pour publier</p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-ink-2">
                    La publication est réservée aux membres connectés. Pas encore de compte ? L&apos;inscription est gratuite.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    <Link href="/connexion?callbackUrl=%2Fpublier" className="whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                      Se connecter
                    </Link>
                    <Link href="/inscription" className="whitespace-nowrap rounded border-2 border-primary px-5 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white">
                      Créer un compte
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">
                Avant de <em>publier</em>
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-ink-2">
                <li>Un contenu = un lieu (pays, ville) et des mots-clés.</li>
                <li>Aucune coordonnée personnelle dans le texte : le contact passe par le formulaire relais du site.</li>
                <li>Les contenus publicitaires ou hors charte sont refusés par la modération.</li>
              </ul>
              <Link href="/legal/cgu" className="mt-3 inline-block text-sm font-bold text-primary hover:underline">
                Lire la charte de publication →
              </Link>
            </div>
            <div className="border border-line bg-paper-2 p-4">
              <h3 className="section-title text-sm">
                Vous <em>recrutez ?</em>
              </h3>
              <p className="mt-2 text-sm text-ink-2">Offres d&apos;emploi et de stage : tout est expliqué dans l&apos;espace recruteur.</p>
              <Link href="/emploi/recruteurs" className="mt-3 inline-block whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline">
                Espace recruteur →
              </Link>
            </div>
            <AdSlot slot="SIDE" section="publier" />
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

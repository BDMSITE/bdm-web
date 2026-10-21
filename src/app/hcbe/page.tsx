import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter, SectionTitle, PageBanner } from "@/components/site/chrome";

export const metadata: Metadata = { title: "Le HCBE" };

/* Page institutionnelle HCBE (CDC §7.12). Présentation factuelle et prudente :
   aucune date, chiffre ou nom non fourni par le HCBE. Le texte officiel
   (histoire, missions détaillées, bureau) sera rédigé par le HCBE. */

function AVenir({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-line bg-paper-2 p-5 text-sm text-ink-2">
      <p className="font-bold text-ink">Texte officiel en cours de rédaction par le HCBE</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

export default function HcbePage() {
  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Le"
        em="HCBE"
        desc="Le Haut Conseil des Béninois de l'Extérieur est l'organe de représentation des Béninois vivant hors du pays. Il édite Béninois du Monde."
      />

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8">
        <section>
          <SectionTitle pre="Qui sommes-" em="nous ?" />
          <div className="max-w-3xl space-y-4 text-[1.02rem] leading-relaxed text-ink">
            <p>
              Le Haut Conseil des Béninois de l&apos;Extérieur (HCBE) représente les Béninois établis hors du pays.
              Il sert de relais entre la diaspora, ses associations et les institutions du Bénin.
            </p>
            <p>
              Association apolitique, laïque et à but non lucratif, le HCBE a été créé à Cotonou en décembre 1997
              à l&apos;initiative des communautés béninoises de l&apos;extérieur, puis reconnu d&apos;utilité publique
              par l&apos;État béninois. Son siège est à Cotonou ; il est organisé en sections par pays de résidence.
            </p>
            <p>
              Béninois du Monde est le portail qu&apos;il édite pour relier les Béninois où qu&apos;ils vivent :
              un média, un annuaire des membres, des entreprises, des associations et des artistes, des offres
              d&apos;emploi, un agenda et des services pratiques.
            </p>
          </div>
        </section>

        <section>
          <SectionTitle pre="Nos" em="missions" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { t: "Représenter", d: "Porter la voix des Béninois de l'extérieur auprès des institutions." },
              { t: "Relier", d: "Mettre en réseau les membres de la diaspora, leurs associations et le Bénin." },
              { t: "Informer", d: "Diffuser une information utile : démarches, opportunités, vie de la communauté." },
            ].map((m) => (
              <article key={m.t} className="border border-line p-5">
                <h3 className="font-display text-lg font-bold text-primary">{m.t}</h3>
                <p className="mt-1 text-sm text-ink-2">{m.d}</p>
              </article>
            ))}
          </div>
          <div className="mt-4">
            <AVenir>Les missions officielles, l&apos;historique et les textes fondateurs du HCBE seront publiés ici dès validation.</AVenir>
          </div>
        </section>

        <section>
          <SectionTitle pre="Le bureau" em="exécutif" />
          <AVenir>La composition du bureau exécutif sera publiée ici une fois communiquée par le HCBE.</AVenir>
        </section>

        <section>
          <SectionTitle pre="Services" em="consulaires" />
          <p className="max-w-3xl text-sm leading-relaxed text-ink-2">
            Les démarches consulaires (passeport, état civil, visas) relèvent des ambassades et consulats du Bénin.
            Le HCBE n&apos;instruit pas ces démarches mais oriente les ressortissants vers la représentation compétente.
          </p>
          <div className="mt-4">
            <AVenir>La liste des ambassades et consulats du Bénin, avec leurs coordonnées officielles, sera publiée ici dès validation.</AVenir>
          </div>
        </section>

        <section className="border-2 border-primary p-6 text-center">
          <h2 className="font-display text-xl font-bold">Nous écrire</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-ink-2">Question, presse, partenariat : le formulaire de contact transmet votre message à l&apos;équipe.</p>
          <Link href="/contact" className="mt-4 inline-block rounded bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">Ouvrir le formulaire de contact</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

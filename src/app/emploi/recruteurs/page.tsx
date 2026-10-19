import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, SectionTitle, PageBanner } from "@/components/site/chrome";

export const metadata: Metadata = { title: "Espace recruteur" };

/* Espace recruteur (CDC §7.3) : description du service réel de dépôt d'offres.
   Pas de tarifs, de quotas ni de références clients inventés. */

export default function RecruteursPage() {
  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Espace"
        em="recruteur"
        desc="Recrutez au Bénin et dans la diaspora : déposez vos offres d'emploi, de stage et de volontariat, elles sont relues puis publiées dans la rubrique Emploi & stages."
      >
        <Link href="/publier" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
          Déposer une offre
        </Link>
      </PageBanner>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8">
        <section>
          <SectionTitle pre="Comment ça" em="marche ?" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { n: "1", t: "Créez le compte de votre structure", d: "Compte entreprise ou association gratuit, avec une fiche dans l'annuaire." },
              { n: "2", t: "Déposez votre offre", d: "Titre, contrat, lieu, description et mots-clés depuis le guichet « Publier ». Relecture par la modération avant mise en ligne." },
              { n: "3", t: "Recevez les candidatures", d: "Les candidats postulent depuis l'offre ; votre adresse e-mail n'est jamais affichée." },
            ].map((s) => (
              <article key={s.n} className="border border-line p-5">
                <span className="font-display text-3xl font-black text-line">{s.n}</span>
                <h3 className="mt-1 font-bold">{s.t}</h3>
                <p className="mt-1 text-sm text-ink-2">{s.d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="border-2 border-primary p-6">
            <h2 className="section-title text-lg">Mettre en avant <em>vos recrutements</em></h2>
            <p className="mt-3 text-sm text-ink-2">
              Pour une visibilité renforcée (mise en avant sur l&apos;accueil, relais dans la newsletter et les alertes e-mail),
              écrivez-nous : les conditions et les tarifs sont communiqués sur demande.
            </p>
            <Link href="/contact" className="mt-5 inline-block rounded bg-primary px-5 py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark">
              Nous contacter
            </Link>
          </div>

          <div className="border border-line bg-paper-2 p-6">
            <h2 className="section-title text-lg">Les <em>candidats</em></h2>
            <p className="mt-3 text-sm text-ink-2">
              Les membres peuvent publier leur CV sur leur profil et s&apos;abonner à des alertes par métier, secteur et ville.
              Vos offres leur sont envoyées dès leur mise en ligne.
            </p>
            <Link href="/communaute/membres" className="mt-4 inline-block whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline">
              Parcourir l&apos;annuaire des membres →
            </Link>
          </div>
        </section>

        <section className="border border-line p-6 text-center">
          <h2 className="font-display text-xl font-bold">Prêt à publier ?</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-ink-2">Connectez-vous avec le compte de votre structure, puis déposez votre offre : elle sera relue avant mise en ligne.</p>
          <Link href="/publier" className="mt-4 inline-block rounded bg-primary px-6 py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark">
            Déposer une offre
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

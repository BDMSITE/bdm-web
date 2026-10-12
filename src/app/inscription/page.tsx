import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, PageBanner } from "@/components/site/chrome";
import { InscriptionForm } from "./form";

export const metadata: Metadata = { title: "Créer un compte" };

/* Inscription gratuite, 4 types de comptes (CDC §7.5). Le compte est créé
   PENDING_EMAIL ; le lien reçu par e-mail l'active. */

export default function InscriptionPage() {
  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Créer un"
        em="compte gratuit"
        desc="Membres, entreprises, associations et artistes : l'inscription est gratuite et le reste. Vous publiez directement, la modération valide."
      />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <InscriptionForm />

          <aside className="space-y-6">
            <div className="border-2 border-primary bg-primary-faint p-5">
              <h3 className="section-title text-sm">Gratuit, <em>vraiment</em></h3>
              <ul className="mt-3 space-y-2 text-sm">
                {["Profil dans l'annuaire mondial", "Publication directe de vos contenus", "Alertes e-mail sur vos mots-clés", "CV visible des recruteurs si vous voulez", "Avantages partenaires réservés aux membres"].map((b) => (
                  <li key={b} className="flex gap-2"><span className="font-bold text-primary">✓</span>{b}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              Vos données restent les vôtres : visibilité champ par champ, export et suppression
              en libre-service. <Link href="/legal/confidentialite" className="font-bold text-primary hover:underline">Politique de confidentialité</Link>.
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

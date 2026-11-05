import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Smartphone, CreditCard } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fedapayConfigured } from "@/lib/fedapay";
import { adhesionActive, adhesionProposee, deviseDuPays, tarifs, moyensDePaiement, fmtEcheance, joursAvant, PLAN_LABEL, RAPPEL_JOURS } from "@/lib/adhesion";
import { AdhesionForm } from "./form";

export const metadata: Metadata = { title: "Mon adhésion" };

/* Mon adhésion (F-156) : statut et échéance, les deux tarifs dans la devise du pays du membre,
   moyens de paiement disponibles dans son pays, bouton Adhérer / Renouveler → FedaPay.
   Le compte reste gratuit : l'adhésion n'ouvre que le badge et les avantages réservés. */

const AVANTAGES = [
  "Badge « Membre HCBE » sur votre profil et vos publications",
  "Codes et conditions des bons plans négociés avec les partenaires",
  "Offres d'emploi et de stage au-delà du quota gratuit",
  "Vous soutenez le Haut Conseil des Béninois de l'Extérieur et ce portail",
];

export default async function AdhesionPage({ searchParams }: { searchParams: Promise<{ etat?: string }> }) {
  const [session, sp] = await Promise.all([auth(), searchParams]);
  if (!(await adhesionProposee())) notFound();
  const userId = session!.user.id;
  const [profile, active, historique] = await Promise.all([
    db.profile.findUnique({ where: { userId }, select: { displayName: true, country: true } }),
    adhesionActive(userId),
    db.membership.findMany({ where: { userId, status: { in: ["ACTIVE", "EXPIRED"] } }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, plan: true, status: true, startsAt: true, endsAt: true, displayAmount: true, createdById: true } }),
  ]);
  const devise = deviseDuPays(profile?.country);
  const [prix, paiement] = await Promise.all([tarifs(devise), Promise.resolve(moyensDePaiement(profile?.country))]);
  const enLigne = fedapayConfigured();
  const joursRestants = joursAvant(active?.endsAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Mon adhésion</h1>
        <p className="mt-1 text-sm text-ink-2">Votre compte Béninois du Monde est et reste gratuit. L&apos;adhésion au HCBE est facultative : elle soutient le Haut Conseil et ouvre quelques avantages réservés.</p>
      </div>

      {sp.etat === "attente" && <p role="status" className="rounded border border-accent bg-accent-light px-3 py-2.5 text-sm">Paiement en cours de confirmation. Cette page se mettra à jour dès que FedaPay nous aura prévenus (quelques minutes au plus).</p>}
      {sp.etat === "refuse" && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">Le paiement n&apos;a pas abouti (refusé ou abandonné). Rien n&apos;a été débité : vous pouvez réessayer.</p>}

      {active ? (
        <section className="border-2 border-primary bg-primary-faint p-5">
          <div className="flex flex-wrap items-center gap-3">
            <BadgeCheck aria-hidden className="h-8 w-8 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-extrabold text-primary-dark">Vous êtes adhérent·e du HCBE</p>
              <p className="text-sm text-ink-2">{PLAN_LABEL[active.plan]} · valable jusqu&apos;au <strong>{fmtEcheance(active.endsAt)}</strong>{joursRestants <= RAPPEL_JOURS && joursRestants > 0 ? ` (dans ${joursRestants} jour${joursRestants > 1 ? "s" : ""})` : ""}.</p>
            </div>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">Membre HCBE</span>
          </div>
          <p className="mt-3 text-xs text-muted">Aucun prélèvement automatique : nous vous écrivons {RAPPEL_JOURS} jours avant l&apos;échéance. Un renouvellement démarre à la fin de l&apos;adhésion en cours.</p>
        </section>
      ) : (
        <section className="border border-line p-5">
          <p className="font-bold">Vous n&apos;êtes pas encore adhérent·e.</p>
          <p className="mt-1 text-sm text-ink-2">Membre gratuit : vous gardez l&apos;annuaire, la publication, les alertes, la messagerie et tout le reste. L&apos;adhésion ajoute :</p>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {AVANTAGES.map((a) => (
              <li key={a} className="flex items-start gap-2"><BadgeCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{a}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="border border-line p-5">
        <h2 className="section-title text-base">{active ? "Renouveler" : "Adhérer"} <em>pour 12 mois</em></h2>
        <p className="mt-2 text-sm text-ink-2">
          Prix affichés {devise === "XOF" ? "en francs CFA" : devise === "EUR" ? "en euros" : "dans votre devise, à titre indicatif"}
          {profile?.country ? ` (${profile.country})` : ""}. {devise !== "XOF" && "Le paiement est encaissé en francs CFA : votre banque ou votre opérateur applique sa conversion."}
          {devise === "XOF" && "Montant exact, débité en FCFA."}
        </p>
        {enLigne ? (
          <AdhesionForm tarifs={prix.map((t) => ({ plan: t.plan, label: t.label, affiche: t.affiche, debite: t.debite, memeDevise: devise === "XOF" }))} renouvellement={Boolean(active)} />
        ) : (
          <div className="mt-4 space-y-3">
            <ul className="grid gap-3 sm:grid-cols-2">
              {prix.map((t) => (
                <li key={t.plan} className="border border-line p-4">
                  <p className="font-bold">{t.label}</p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-primary">{t.affiche}</p>
                  {devise !== "XOF" && <p className="text-xs text-muted">débité {t.debite}</p>}
                </li>
              ))}
            </ul>
            <p className="rounded border border-accent bg-accent-light px-3 py-2.5 text-sm">Le paiement en ligne ouvre bientôt. En attendant, <Link href="/contact?sujet=Adhésion%20HCBE" className="font-bold text-primary hover:underline">écrivez au HCBE</Link> : votre adhésion sera activée à la main après règlement.</p>
          </div>
        )}
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Smartphone aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              <strong>Mobile Money</strong>
              {paiement.mobile.length > 0 ? ` ${profile?.country ? `(${profile.country})` : ""} : ${paiement.mobile.join(", ")}.` : " : disponible depuis le Bénin, le Togo, la Côte d'Ivoire, le Sénégal, le Niger, le Mali, le Burkina Faso et la Guinée."}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CreditCard aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p><strong>Carte bancaire</strong> Visa ou Mastercard, depuis tous les pays. Paiement sécurisé par FedaPay ; nous ne voyons jamais vos numéros.</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted">Tarif réduit : jeunes jusqu&apos;à 20 ans et étudiants, sur déclaration sur l&apos;honneur. Paiement hors ligne ou question : <Link href="/contact?sujet=Adhésion%20HCBE" className="font-semibold text-primary hover:underline">écrire au HCBE</Link>.</p>
      </section>

      {historique.length > 0 && (
        <section className="border border-line p-5">
          <h2 className="section-title text-base">Mes <em>adhésions</em></h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {historique.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <span className="w-full font-semibold sm:w-auto sm:flex-1">{PLAN_LABEL[h.plan]}{h.createdById ? " · enregistrée par le HCBE" : ""}</span>
                <span className="text-ink-2">{fmtEcheance(h.startsAt)} → {fmtEcheance(h.endsAt)}</span>
                {h.displayAmount && <span className="text-ink-2">{h.displayAmount}</span>}
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${h.status === "ACTIVE" ? "bg-primary-light text-primary-dark" : "bg-paper-2 text-ink-2"}`}>{h.status === "ACTIVE" ? "En cours" : "Terminée"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

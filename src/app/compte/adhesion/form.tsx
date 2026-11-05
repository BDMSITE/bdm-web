"use client";

import { useActionState, useState } from "react";
import { startMembershipAction, type AdhesionState } from "@/lib/actions/adhesion";

/* Choix du tarif puis départ vers le paiement FedaPay. Le tarif réduit exige une case
   « sur l'honneur » (jeunes jusqu'à 20 ans, étudiants). */

type TarifProps = { plan: "ANNUEL" | "ETUDIANT"; label: string; affiche: string; debite: string; memeDevise: boolean };

export function AdhesionForm({ tarifs, renouvellement }: { tarifs: TarifProps[]; renouvellement: boolean }) {
  const [state, action, pending] = useActionState<AdhesionState, FormData>(startMembershipAction, {});
  const [plan, setPlan] = useState<"ANNUEL" | "ETUDIANT">("ANNUEL");

  return (
    <form action={action} className="mt-4 space-y-4">
      {state.error && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error}</p>}
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">Formule</legend>
        {tarifs.map((t) => (
          <label key={t.plan} className={`cursor-pointer border-2 p-4 ${plan === t.plan ? "border-primary bg-primary-faint" : "border-line hover:border-primary"}`}>
            <span className="flex items-start gap-3">
              <input type="radio" name="plan" value={t.plan} checked={plan === t.plan} onChange={() => setPlan(t.plan)} className="mt-1 h-4 w-4 accent-primary" />
              <span className="min-w-0">
                <span className="block font-bold">{t.label}</span>
                <span className="mt-1 block font-display text-2xl font-extrabold text-primary">{t.affiche}<span className="ml-1 text-sm font-semibold text-ink-2">/ an</span></span>
                {!t.memeDevise && <span className="block text-xs text-muted">débité {t.debite}</span>}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      {plan === "ETUDIANT" && (
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="attestation" required className="mt-0.5 h-5 w-5 accent-primary" />
          <span>Je déclare sur l&apos;honneur avoir 20 ans ou moins, ou être étudiant·e. Le HCBE peut demander un justificatif.</span>
        </label>
      )}
      <button type="submit" disabled={pending} className="rounded bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
        {pending ? "Préparation du paiement…" : renouvellement ? "Renouveler mon adhésion" : "Adhérer et payer"}
      </button>
      <p className="text-xs text-muted">Vous serez dirigé·e vers le paiement sécurisé FedaPay (Mobile Money ou carte). Aucun renouvellement automatique.</p>
    </form>
  );
}

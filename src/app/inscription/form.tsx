"use client";

import Link from "next/link";
import { PasswordInput } from "@/components/site/password-input";
import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/lib/actions/auth";
import { Turnstile } from "@/components/site/turnstile";

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none aria-[invalid=true]:border-danger";

export function InscriptionForm({ turnstileSiteKey = "" }: { turnstileSiteKey?: string }) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerAction, {});
  const invalid = (champ: string) => (state.champ === champ ? true : undefined);

  return (
    <form action={action} noValidate>
      <input type="hidden" name="accountType" value="MEMBER" />
      <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">
        Mes <em>informations</em>
      </h2>
      <div className="space-y-5 border border-line p-5">
        {state.error && (
          <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">
            {state.error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="prenom" className="mb-1 block text-sm font-bold">Prénom *</label>
            <input id="prenom" name="prenom" required autoComplete="given-name" aria-invalid={invalid("prenom")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="nom" className="mb-1 block text-sm font-bold">Nom *</label>
            <input id="nom" name="nom" required autoComplete="family-name" aria-invalid={invalid("nom")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-bold">E-mail *</label>
            <input id="email" name="email" type="email" required autoComplete="email" aria-invalid={invalid("email")} className={INPUT} />
            <p className="mt-1 text-xs text-muted">Un lien de confirmation vous sera envoyé.</p>
          </div>
          <div>
            <label htmlFor="pays" className="mb-1 block text-sm font-bold">Pays de résidence *</label>
            <select id="pays" name="pays" aria-invalid={invalid("pays")} className={INPUT}>
              {["Bénin", "France", "Canada", "Belgique", "USA", "Côte d'Ivoire", "Togo", "Autre"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ville" className="mb-1 block text-sm font-bold">Ville *</label>
            <input id="ville" name="ville" required autoComplete="address-level2" aria-invalid={invalid("ville")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="secteur" className="mb-1 block text-sm font-bold">Secteur d&apos;activité</label>
            <select id="secteur" name="secteur" className={INPUT}>
              {["Informatique", "Santé", "Finance", "BTP", "Éducation", "Droit", "Commerce", "Logistique", "Agriculture", "Art & spectacle", "Autre"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mdp" className="mb-1 block text-sm font-bold">Mot de passe * <span className="font-normal text-muted">(8 caractères min.)</span></label>
            <PasswordInput id="mdp" name="password" required minLength={8} autoComplete="new-password" aria-invalid={invalid("password")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="mdp2" className="mb-1 block text-sm font-bold">Confirmer *</label>
            <PasswordInput id="mdp2" name="password2" required autoComplete="new-password" aria-invalid={invalid("password2")} className={INPUT} />
          </div>
        </div>

        <div className="space-y-2 border-t border-line pt-4 text-sm">
          <label className="flex items-start gap-2.5">
            <input type="checkbox" name="cgu" className="mt-0.5 h-4 w-4 accent-primary" />
            <span>J&apos;accepte les <Link href="/legal/cgu" className="font-bold text-primary hover:underline">CGU et la charte de publication</Link>. *</span>
          </label>
          <label className="flex items-start gap-2.5">
            <input type="checkbox" name="annuaire" defaultChecked className="mt-0.5 h-4 w-4 accent-primary" />
            <span>Je souhaite apparaître dans l&apos;annuaire public des membres (modifiable à tout moment).</span>
          </label>
          <label className="flex items-start gap-2.5">
            <input type="checkbox" name="newsletter" className="mt-0.5 h-4 w-4 accent-primary" />
            <span>Je m&apos;abonne à la newsletter mensuelle.</span>
          </label>
        </div>

        <Turnstile siteKey={turnstileSiteKey} />
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="whitespace-nowrap rounded bg-primary px-6 py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {pending ? "Création…" : "Créer mon compte"}
          </button>
          <span className="text-sm text-ink-2">
            Déjà inscrit·e ? <Link href="/connexion" className="font-bold text-primary hover:underline">Se connecter</Link>
          </span>
        </div>
        <p className="text-xs text-muted">Vous représentez une entreprise, une association ou un groupe artistique ? Vous l&apos;indiquerez dans votre profil, après l&apos;inscription.</p>
      </div>
    </form>
  );
}

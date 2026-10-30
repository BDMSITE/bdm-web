"use client";

import Link from "next/link";
import { PasswordInput } from "@/components/site/password-input";
import { LieuFields } from "@/components/site/lieu-fields";
import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/lib/actions/auth";
import { Turnstile } from "@/components/site/turnstile";

const T = {
  fr: {
    titre: ["Mes", "informations"], prenom: "Prénom", nom: "Nom", email: "E-mail", emailHint: "Un lien de confirmation vous sera envoyé.",
    pays: "Pays de résidence", ville: "Ville", secteur: "Secteur d'activité", nonPrecise: "Non précisé", mdp: "Mot de passe", mdpHint: "(8 caractères min.)", confirmer: "Confirmer",
    cgu1: "J'accepte les ", cguLien: "CGU et la charte de publication", annuaire: "Je souhaite apparaître dans l'annuaire public des membres (modifiable à tout moment).",
    newsletter: "Je m'abonne à la newsletter mensuelle.", creer: "Créer mon compte", creation: "Création…", deja: "Déjà inscrit·e ?", connexion: "Se connecter", connexionHref: "/connexion",
    represente: "Vous représentez une entreprise, une association ou un groupe artistique ? Vous l'indiquerez dans votre profil, après l'inscription.",
    erreurs: {} as Record<string, string>,
  },
  en: {
    titre: ["My", "details"], prenom: "First name", nom: "Last name", email: "Email", emailHint: "A confirmation link will be sent to you.",
    pays: "Country of residence", ville: "City", secteur: "Field of work", nonPrecise: "Not specified", mdp: "Password", mdpHint: "(8 characters min.)", confirmer: "Confirm",
    cgu1: "I accept the ", cguLien: "terms of use and publishing charter (in French)", annuaire: "List me in the public member directory (you can change this anytime).",
    newsletter: "Subscribe me to the monthly newsletter.", creer: "Create my account", creation: "Creating…", deja: "Already a member?", connexion: "Sign in", connexionHref: "/en/sign-in",
    represente: "Representing a company, an association or a band? You will say so in your profile, after signing up.",
    erreurs: { prenom: "First name is required.", nom: "Last name is required.", email: "Invalid email address.", pays: "Country is required.", ville: "City is required.", password: "Password: 8 characters minimum.", password2: "Passwords do not match.", cgu: "You must accept the terms of use." } as Record<string, string>,
  },
};

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none aria-[invalid=true]:border-danger";

export function InscriptionForm({ turnstileSiteKey = "", lang = "fr" }: { turnstileSiteKey?: string; lang?: "fr" | "en" }) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerAction, {});
  const invalid = (champ: string) => (state.champ === champ ? true : undefined);
  const t = T[lang];
  const erreur = state.error ? (state.champ && t.erreurs[state.champ]) || state.error : null;

  return (
    <form action={action} noValidate>
      <input type="hidden" name="accountType" value="MEMBER" />
      <input type="hidden" name="lang" value={lang} />
      <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">
        {t.titre[0]} <em>{t.titre[1]}</em>
      </h2>
      <div className="space-y-5 border border-line p-5">
        {state.error && (
          <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">
            {erreur}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="prenom" className="mb-1 block text-sm font-bold">{t.prenom} *</label>
            <input id="prenom" name="prenom" required autoComplete="given-name" aria-invalid={invalid("prenom")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="nom" className="mb-1 block text-sm font-bold">{t.nom} *</label>
            <input id="nom" name="nom" required autoComplete="family-name" aria-invalid={invalid("nom")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-bold">{t.email} *</label>
            <input id="email" name="email" type="email" required autoComplete="email" aria-invalid={invalid("email")} className={INPUT} />
            <p className="mt-1 text-xs text-muted">{t.emailHint}</p>
          </div>
          <LieuFields countryName="pays" cityName="ville" required countryLabel={t.pays} cityLabel={t.ville} countryInvalid={invalid("pays")} cityInvalid={invalid("ville")} inputClass={INPUT} />
          <div>
            <label htmlFor="secteur" className="mb-1 block text-sm font-bold">{t.secteur}</label>
            <select id="secteur" name="secteur" className={INPUT}>
              <option value="">{t.nonPrecise}</option>
              {["Informatique", "Santé", "Finance", "BTP", "Éducation", "Droit", "Commerce", "Logistique", "Agriculture", "Art & spectacle", "Autre"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mdp" className="mb-1 block text-sm font-bold">{t.mdp} * <span className="font-normal text-muted">{t.mdpHint}</span></label>
            <PasswordInput id="mdp" name="password" required minLength={8} autoComplete="new-password" aria-invalid={invalid("password")} className={INPUT} />
          </div>
          <div>
            <label htmlFor="mdp2" className="mb-1 block text-sm font-bold">{t.confirmer} *</label>
            <PasswordInput id="mdp2" name="password2" required autoComplete="new-password" aria-invalid={invalid("password2")} className={INPUT} />
          </div>
        </div>

        <div className="space-y-2 border-t border-line pt-4 text-sm">
          <label className="flex items-start gap-2.5">
            <input type="checkbox" name="cgu" className="mt-0.5 h-4 w-4 accent-primary" />
            <span>{t.cgu1}<Link href="/legal/cgu" className="font-bold text-primary hover:underline">{t.cguLien}</Link>. *</span>
          </label>
          <label className="flex items-start gap-2.5">
            <input type="checkbox" name="annuaire" defaultChecked className="mt-0.5 h-4 w-4 accent-primary" />
            <span>{t.annuaire}</span>
          </label>
          <label className="flex items-start gap-2.5">
            <input type="checkbox" name="newsletter" className="mt-0.5 h-4 w-4 accent-primary" />
            <span>{t.newsletter}</span>
          </label>
        </div>

        <Turnstile siteKey={turnstileSiteKey} />
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="whitespace-nowrap rounded bg-primary px-6 py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {pending ? t.creation : t.creer}
          </button>
          <span className="text-sm text-ink-2">
            {t.deja} <Link href={t.connexionHref} className="font-bold text-primary hover:underline">{t.connexion}</Link>
          </span>
        </div>
        <p className="text-xs text-muted">{t.represente}</p>
      </div>
    </form>
  );
}

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PasswordForm } from "./form";
import { startTwoFactorAction } from "@/lib/actions/compte";
import { DisableTwoFactorForm } from "./2fa/form";

export const metadata: Metadata = { title: "Sécurité" };

/* Mot de passe du compte connecté (CDC §7.16) et double authentification
   (réservée aux rôles de l'équipe, qui accèdent au back-office). */

const STAFF = new Set(["EDITOR", "MODERATOR", "REGIE", "ADMIN"]);

export default async function SecuritePage() {
  const session = await auth();
  const user = await db.user.findUnique({ where: { id: session!.user.id }, select: { passwordHash: true, twoFactorSecret: true } });
  const hasPassword = Boolean(user?.passwordHash);
  const staff = STAFF.has(session!.user.role ?? "");
  const twoFactor = Boolean(user?.twoFactorSecret);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Sécurité</h1>
        <p className="mt-1 text-sm text-ink-2">Mot de passe et protection de votre compte.</p>
      </div>

      {hasPassword ? (
        <PasswordForm />
      ) : (
        <div className="border border-line p-5">
          <p className="font-bold">Mot de passe</p>
          <p className="mt-2 text-sm text-ink-2">
            Ce compte n&apos;a pas de mot de passe : vous vous connectez avec un lien envoyé par e-mail. La définition
            d&apos;un mot de passe depuis cet espace arrivera prochainement.
          </p>
        </div>
      )}

      <div className="space-y-4 border border-line p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-bold">Double authentification (2FA)</p>
            <p className="text-sm text-ink-2">
              {staff
                ? "Un code de votre application d'authentification est demandé à chaque connexion par mot de passe. Fortement recommandée pour les comptes qui accèdent au back-office."
                : "Réservée aux comptes de l'équipe du site (rédaction, modération, régie, administration)."}
            </p>
          </div>
          {staff ? (
            twoFactor ? (
              <span className="whitespace-nowrap rounded bg-primary-light px-3 py-1 text-xs font-bold text-primary-dark">Activée</span>
            ) : hasPassword ? (
              <form action={startTwoFactorAction}>
                <button type="submit" className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">Activer</button>
              </form>
            ) : (
              <span className="whitespace-nowrap rounded border border-line px-3 py-1 text-xs font-semibold text-ink-2">Mot de passe requis</span>
            )
          ) : (
            <span className="whitespace-nowrap rounded border border-line px-3 py-1 text-xs font-semibold text-ink-2">Non disponible</span>
          )}
        </div>
        {staff && twoFactor && <DisableTwoFactorForm />}
      </div>
    </div>
  );
}

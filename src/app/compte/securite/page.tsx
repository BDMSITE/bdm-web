import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PasswordForm } from "./form";

export const metadata: Metadata = { title: "Sécurité" };

/* Mot de passe du compte connecté (CDC §7.16). */

export default async function SecuritePage() {
  const session = await auth();
  const user = await db.user.findUnique({ where: { id: session!.user.id }, select: { passwordHash: true } });
  const hasPassword = Boolean(user?.passwordHash);

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

      <div className="flex flex-wrap items-center gap-4 border border-line p-5">
        <div className="min-w-0 flex-1">
          <p className="font-bold">Double authentification (2FA)</p>
          <p className="text-sm text-ink-2">
            Un code depuis votre application d&apos;authentification à chaque connexion. Fonction à venir.
          </p>
        </div>
        <span className="whitespace-nowrap rounded border border-line px-3 py-1 text-xs font-semibold text-ink-2">À venir</span>
      </div>
    </div>
  );
}

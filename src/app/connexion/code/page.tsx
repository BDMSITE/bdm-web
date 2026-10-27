import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SiteHeader, SiteFooter } from "@/components/site/chrome";
import { twoFactorLoginAction } from "@/lib/actions/auth";
import { verifyToken } from "@/lib/signed-token";

export const metadata: Metadata = { title: "Code de sécurité" };

/* Étape 2 de la connexion pour les comptes avec double authentification. */

export default async function CodePage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const [sp, jar] = await Promise.all([searchParams, cookies()]);
  if (!verifyToken(jar.get("bdm_2fa")?.value, "2fa-pending")) redirect("/connexion?erreur=2fa_expire");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <section className="border border-line p-6">
          <h1 className="section-title text-xl">Code de <em>sécurité</em></h1>
          <p className="mt-3 text-sm text-ink-2">Ouvrez votre application d&apos;authentification et saisissez le code à 6 chiffres.</p>
          {sp.erreur === "code" && (
            <p role="alert" className="mt-4 rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">Code incorrect ou expiré.</p>
          )}
          <form action={twoFactorLoginAction} className="mt-5 space-y-4">
            <div>
              <label htmlFor="code" className="mb-1 block text-sm font-bold">Code à 6 chiffres</label>
              <input id="code" name="code" inputMode="numeric" pattern="[0-9 ]{6,7}" autoComplete="one-time-code" required autoFocus className="w-full rounded border border-line bg-paper px-3 py-2.5 text-center font-mono text-2xl tracking-[0.4em] focus:border-primary focus:outline-none" />
            </div>
            <button type="submit" className="w-full rounded bg-primary py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark">Valider</button>
          </form>
          <p className="mt-4 text-xs text-muted">Vous avez 5 minutes. Sans accès à votre application, contactez l&apos;administrateur du site.</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

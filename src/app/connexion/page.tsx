import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/site/chrome";
import { loginAction, magicLinkAction } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Connexion" };

const MESSAGES: Record<string, { tone: "ok" | "err"; text: string }> = {
  "erreur=identifiants": { tone: "err", text: "E-mail ou mot de passe incorrect." },
  "erreur=email_non_confirme": { tone: "err", text: "Confirmez d'abord votre adresse : ouvrez le lien reçu par e-mail, ou demandez-en un nouveau ci-dessous." },
  "erreur=email": { tone: "err", text: "Adresse e-mail invalide." },
  "erreur=2fa_expire": { tone: "err", text: "Délai dépassé pour le code de double authentification : reconnectez-vous." },
  "erreur=trop": { tone: "err", text: "Trop de tentatives : patientez un quart d'heure avant de réessayer." },
  "erreur=auth": { tone: "err", text: "Connexion impossible pour le moment. Réessayez dans quelques instants." },
  "envoye=1": { tone: "ok", text: "Lien envoyé ! Vérifiez votre boîte mail (dossier indésirables inclus)." },
  "inscrit=1": { tone: "ok", text: "Compte créé ! Un lien de confirmation vous a été envoyé : cliquez dessus pour activer votre compte." },
};

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2.5 text-sm focus:border-primary focus:outline-none";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const key = Object.entries(sp).map(([k, v]) => `${k}=${v}`).find((k) => k in MESSAGES);
  const message = key ? MESSAGES[key] : null;
  const suite = sp.callbackUrl?.startsWith("/") ? sp.callbackUrl : "/compte";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-4xl gap-8 px-4 py-12 md:grid-cols-2">
        <section className="border border-line p-6">
          <h1 className="section-title text-xl">Se <em>connecter</em></h1>

          {message && (
            <p
              role={message.tone === "err" ? "alert" : "status"}
              className={`mt-4 rounded border px-3 py-2.5 text-sm ${
                message.tone === "err"
                  ? "border-danger bg-danger-light text-danger"
                  : "border-primary bg-primary-faint text-primary-dark"
              }`}
            >
              {message.text}
            </p>
          )}

          <form action={loginAction} className="mt-5 space-y-4">
            <input type="hidden" name="suite" value={suite} />
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-bold">E-mail</label>
              <input id="email" name="email" type="email" required autoComplete="email" className={INPUT} />
            </div>
            <div>
              <label htmlFor="pass" className="mb-1 block text-sm font-bold">Mot de passe</label>
              <input id="pass" name="password" type="password" required autoComplete="current-password" className={INPUT} />
            </div>
            <button type="submit" className="w-full rounded bg-primary py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark">
              Connexion
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted">
            <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
          </div>

          <form action={magicLinkAction} className="space-y-3">
            <label htmlFor="email-magic" className="block text-sm font-bold">
              Sans mot de passe : recevoir un lien de connexion
            </label>
            <input id="email-magic" name="email" type="email" required autoComplete="email" placeholder="votre@email.com" className={INPUT} />
            <button type="submit" className="w-full rounded border-2 border-line py-2.5 text-sm font-bold text-ink-2 hover:border-primary hover:text-primary">
              Recevoir un lien magique par e-mail
            </button>
            <p className="text-xs text-muted">Mot de passe oublié ? Le lien magique vous connecte sans le saisir.</p>
          </form>
        </section>

        <section className="border-2 border-primary bg-primary-faint p-6">
          <h2 className="section-title text-xl">Pas encore <em>membre ?</em></h2>
          <p className="mt-3 text-sm text-ink-2">L&apos;inscription est gratuite et ouverte à tous : particuliers, entreprises, associations, artistes.</p>
          <ul className="mt-4 space-y-2 text-sm">
            {["Profil dans l'annuaire mondial", "Publication directe : articles, offres, événements, annonces", "Alertes e-mail sur vos mots-clés", "CV visible des recruteurs si vous le souhaitez", "Bons plans et réductions partenaires"].map((b) => (
              <li key={b} className="flex gap-2"><span className="font-bold text-primary">✓</span>{b}</li>
            ))}
          </ul>
          <Link href="/inscription" className="mt-5 inline-block rounded bg-primary px-6 py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark">
            Créer mon compte gratuit
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

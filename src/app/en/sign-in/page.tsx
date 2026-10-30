import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/site/chrome";
import { PasswordInput } from "@/components/site/password-input";
import { loginAction, magicLinkAction } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Sign in" };

/* English sign-in: same actions as /connexion; the hidden « lang » field brings
   error messages back here. The member area itself is in French. */

const MESSAGES: Record<string, { tone: "ok" | "err"; text: string }> = {
  "erreur=identifiants": { tone: "err", text: "Wrong email or password." },
  "erreur=email_non_confirme": { tone: "err", text: "Please confirm your email address first: open the link we sent you, or request a new one below." },
  "erreur=email": { tone: "err", text: "Invalid email address." },
  "erreur=2fa_expire": { tone: "err", text: "Two-factor code timed out: please sign in again." },
  "erreur=trop": { tone: "err", text: "Too many attempts: wait fifteen minutes and try again." },
  "erreur=inconnu": { tone: "err", text: "No account with this address. Check the spelling or create your free account." },
  "erreur=auth": { tone: "err", text: "Sign-in is not possible right now. Please try again in a moment." },
  "envoye=1": { tone: "ok", text: "Link sent! Check your inbox (and the spam folder)." },
  "inscrit=1": { tone: "ok", text: "Account created! We sent you a confirmation link: click it to activate your account." },
};

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2.5 text-sm focus:border-primary focus:outline-none";

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const key = Object.entries(sp).map(([k, v]) => `${k}=${v}`).find((k) => k in MESSAGES);
  const message = key ? MESSAGES[key] : null;
  const suite = sp.callbackUrl?.startsWith("/") ? sp.callbackUrl : "/compte";

  return (
    <div lang="en">
      <SiteHeader />
      <main className="mx-auto grid max-w-4xl gap-8 px-4 py-12 md:grid-cols-2">
        <section className="border border-line p-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="section-title text-xl">Sign <em>in</em></h1>
            <Link href="/connexion" lang="fr" className="text-xs font-bold uppercase text-primary hover:underline">Français</Link>
          </div>
          {message && (
            <p role={message.tone === "err" ? "alert" : "status"} className={`mt-4 rounded border px-3 py-2.5 text-sm ${message.tone === "err" ? "border-danger bg-danger-light text-danger" : "border-primary bg-primary-faint text-primary-dark"}`}>
              {message.text}
            </p>
          )}
          <form action={loginAction} className="mt-5 space-y-4">
            <input type="hidden" name="suite" value={suite} />
            <input type="hidden" name="lang" value="en" />
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-bold">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className={INPUT} />
            </div>
            <div>
              <label htmlFor="pass" className="mb-1 block text-sm font-bold">Password</label>
              <PasswordInput id="pass" name="password" required autoComplete="current-password" className={INPUT} />
            </div>
            <button type="submit" className="w-full rounded bg-primary py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark">Sign in</button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <form action={magicLinkAction} className="space-y-3">
            <input type="hidden" name="lang" value="en" />
            <label htmlFor="email-magic" className="block text-sm font-bold">No password: get a sign-in link</label>
            <input id="email-magic" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={INPUT} />
            <button type="submit" className="w-full rounded border-2 border-line py-2.5 text-sm font-bold text-ink-2 hover:border-primary hover:text-primary">Email me a magic link</button>
            <p className="text-xs text-muted">Forgot your password? The magic link signs you in without it.</p>
          </form>
        </section>
        <section className="border-2 border-primary bg-primary-faint p-6">
          <h2 className="section-title text-xl">Not a <em>member yet?</em></h2>
          <p className="mt-3 text-sm text-ink-2">Signing up is free and open to everyone: individuals, companies, associations, artists.</p>
          <ul className="mt-4 space-y-2 text-sm">
            {["A profile in the worldwide directory", "Publish directly: articles, jobs, events, classifieds", "Email alerts on your keywords", "CV visible to recruiters if you wish", "Partner deals and discounts"].map((b) => (
              <li key={b} className="flex gap-2"><span aria-hidden className="font-bold text-primary">✓</span>{b}</li>
            ))}
          </ul>
          <Link href="/en/join" className="mt-5 inline-block rounded bg-primary px-6 py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark">Create my free account</Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

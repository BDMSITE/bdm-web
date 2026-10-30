import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, PageBanner, LangSwitch } from "@/components/site/chrome";
import { InscriptionForm } from "@/app/inscription/form";
import { turnstileSiteKey } from "@/lib/turnstile";

export const metadata: Metadata = {
  title: "Join Béninois du Monde",
  description: "Free account for the Beninese diaspora and people of African descent: directory, jobs, events, good addresses, alerts.",
};

/* English sign-up: same form and same account as the French one (one member account,
   free). Server-side validation messages are translated for the common cases. */

export default function JoinPage() {
  return (
    <div lang="en">
      <SiteHeader />
      <PageBanner
        pre="Create a"
        em="free account"
        desc="Individuals, companies, associations, artists: one free member account. You publish directly, the editorial team reviews."
      >
        <LangSwitch fr="/inscription" en="/en/join" current="en" />
      </PageBanner>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <InscriptionForm turnstileSiteKey={turnstileSiteKey} lang="en" />
          <aside className="space-y-6">
            <div className="border-2 border-primary bg-primary-faint p-5">
              <h3 className="section-title text-sm">Free, <em>really</em></h3>
              <ul className="mt-3 space-y-2 text-sm">
                {["A profile in the worldwide directory", "Publish your own content", "Email alerts on your keywords", "CV visible to recruiters if you wish", "Partner deals reserved for members"].map((b) => (
                  <li key={b} className="flex gap-2"><span aria-hidden className="font-bold text-primary">✓</span>{b}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              Your data stays yours: field-by-field visibility, self-service export and deletion. The site itself is in French;
              the <Link href="/en/roots" className="font-bold text-primary hover:underline">Roots</Link> section and the community pages are available in English.{" "}
              <Link href="/legal/confidentialite" className="font-bold text-primary hover:underline">Privacy policy (French)</Link>.
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

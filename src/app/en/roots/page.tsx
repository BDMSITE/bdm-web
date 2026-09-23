import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, SectionTitle, AdSlot, LangSwitch } from "@/components/site/chrome";
import { Landmark, ScrollText, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Roots — Your Beninese heritage",
  description:
    "Benin welcomes people of African descent: citizenship under Law 2024-31, memorial sites in Ouidah, and a diaspora network to help you come home.",
};

/* MAQUETTE — Version anglaise de la rubrique Racines, pour les afrodescendants
   anglophones (USA, Caraïbes…). Seule cette rubrique est traduite : le reste
   du site demeure en français. Contenus d'exemple. */

const STEPS = [
  { t: "Check your eligibility", d: "One sub-Saharan ancestor deported through the transatlantic slave trade." },
  { t: "Build your file", d: "Proof of descent: records, recognized DNA tests, documented genealogy." },
  { t: "Apply online", d: "Through the official My Afro Origins portal, reviewed by the Beninese State." },
  { t: "Become Beninese", d: "Certificate of nationality, then ID card — and a country that welcomes you." },
];

export default function RootsPage() {
  return (
    <div lang="en">
      <SiteHeader />

      <div className="wax-bg bg-primary-darker py-10 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="section-title text-2xl md:text-3xl">
            Your Beninese <em className="!text-accent">roots</em>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">
            Benin is the land your ancestors were taken from — and the first country to open
            citizenship to people of African descent. From the Door of No Return in Ouidah to a
            passport in your name: this is where the journey home begins.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/publier"
              className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark"
            >
              Join the network
            </Link>
            <LangSwitch fr="/memoire" en="/en/roots" current="en" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <SectionTitle pre="Becoming a citizen: the" em="pathway" />
              <p className="text-sm leading-relaxed text-ink-2">
                Under <strong>Law No. 2024-31</strong>, Benin grants nationality to people of
                African descent whose ancestor was deported through the slave trade. Applications
                are made online via the official <strong>My Afro Origins</strong> program.
              </p>
              <ol className="mt-5 grid gap-4 sm:grid-cols-2">
                {STEPS.map((s, i) => (
                  <li key={s.t} className="card-soft border border-line bg-paper p-4">
                    <span aria-hidden className="font-script text-3xl leading-none text-primary">
                      {i + 1}
                    </span>
                    <h3 className="mt-1 font-bold leading-tight">{s.t}</h3>
                    <p className="mt-1 text-sm text-ink-2">{s.d}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-muted">
                Informational guide — official applications are handled on the national portal.
              </p>
            </section>

            <section>
              <SectionTitle pre="Walk where they" em="walked" />
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { name: "Door of No Return", city: "OUIDAH", d: "Memorial on the beach where the deported left the continent." },
                  { name: "Slave Route", city: "OUIDAH", d: "The 4 km trail from the auction square to the shore." },
                  { name: "Royal Palaces", city: "ABOMEY", d: "UNESCO site of the kingdom of Danxomè." },
                ].map((l) => (
                  <article key={l.name} className="card-soft border border-line bg-paper">
                    <div className="aspect-[4/3] bg-paper-2" />
                    <div className="p-3">
                      <p className="card-location">{l.city}</p>
                      <h3 className="mt-1 font-bold leading-tight">{l.name}</h3>
                      <p className="mt-1 text-sm text-ink-2">{l.d}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-6 sm:grid-cols-3">
              {[
                { t: "They came home", d: "The Agudas: Afro-Brazilian families who returned to Benin two centuries ago.", i: Landmark, href: "/magazine/les-agudas" },
                { t: "Practical guides", d: "Genealogy, visas, settling in — step-by-step guides for your return.", i: ScrollText, href: "/memoire" },
                { t: "A living network", d: "Members across 47 countries, events and verified contacts.", i: Users, href: "/communaute" },
              ].map((b) => (
                <article key={b.t} className="border border-line p-5">
                  <b.i aria-hidden className="h-7 w-7 text-primary" strokeWidth={2.2} />
                  <h2 className="mt-2 font-display text-lg font-bold">{b.t}</h2>
                  <p className="mt-1 text-sm text-ink-2">{b.d}</p>
                  <Link href={b.href} className="mt-3 inline-block whitespace-nowrap text-sm font-bold uppercase text-primary hover:underline">
                    Explore →
                  </Link>
                </article>
              ))}
            </section>
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary p-4">
              <h3 className="section-title text-sm">
                Find your <em>roots</em>
              </h3>
              <p className="mt-2 text-sm text-ink-2">
                Verified genealogists, historians and lawyers can guide you — contact through the
                site, your e-mail is never exposed.
              </p>
              <button className="mt-3 w-full rounded bg-primary py-2 text-sm font-bold text-white hover:bg-primary-dark">
                Get support
              </button>
            </div>
            <AdSlot label="sidebar" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

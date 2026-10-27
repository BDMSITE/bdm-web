import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter, SectionTitle, AdSlot, LangSwitch } from "@/components/site/chrome";
import { EmptyState } from "@/components/site/content";
import { listContents } from "@/lib/content";
import { contentHref } from "@/lib/routes";
import { ScrollText, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Roots — Your Beninese heritage",
  description:
    "Benin welcomes people of African descent: nationality under Law 2024-31, memorial sites, and a diaspora network to help you come home.",
};

/* English version of the « Mémoire & racines » section, for English-speaking
   people of African descent. Only this section is translated. Factual content
   only: the law is described without invented details; memorial sites come
   from the database (MEMORY_PLACE contents). */

const STEPS = [
  { t: "Check your eligibility", d: "The law concerns people of African descent whose ancestor was deported through the slave trade." },
  { t: "Gather your evidence", d: "Documents establishing your descent, as required by the official procedure." },
  { t: "Apply online", d: "Applications are filed on the official portal of the Beninese State." },
  { t: "Follow the official process", d: "Review and decision are handled by the Beninese authorities." },
];

export default async function RootsPage() {
  const places = await listContents({ types: ["MEMORY_PLACE"], take: 6 });

  return (
    <div lang="en">
      <SiteHeader />

      <div className="wax-bg bg-primary-darker py-10 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="section-title text-2xl md:text-3xl">
            Your Beninese <em className="!text-accent">roots</em>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">
            Benin has opened a path to nationality for people of African descent. From the memorial
            sites of the slave trade to a diaspora network: this is where the journey home begins.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/inscription"
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
                Under <strong>Law No. 2024-31</strong>, Benin recognises the nationality of people of
                African descent whose ancestor was deported through the slave trade. Applications
                are made online through the official portal of the Beninese State.
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
                This page is informational only. Eligibility criteria, required documents and decisions
                are set by the Beninese authorities on the official portal.
              </p>
            </section>

            <section>
              <SectionTitle pre="Walk where they" em="walked" href={places.total > places.items.length ? "/memoire" : undefined} />
              {places.items.length === 0 ? (
                <EmptyState
                  title="Memorial sites are being documented"
                  text="The editorial team is preparing the first memorial sites. They will appear here once published."
                  href="/memoire"
                  cta="See the French section"
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  {places.items.map((p) => (
                    <article key={p.id} className="card-soft border border-line bg-paper p-3">
                      <p className="card-location">{[p.city, p.country].filter(Boolean).join(" · ")}</p>
                      <h3 className="mt-1 font-bold leading-tight">
                        <Link href={contentHref(p.type, p.slug)} className="hover:text-primary">{p.title}</Link>
                      </h3>
                      {p.excerpt && <p className="mt-1 line-clamp-3 text-sm text-ink-2">{p.excerpt}</p>}
                    </article>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-muted">Site pages are in French.</p>
            </section>

            <section className="grid gap-6 sm:grid-cols-2">
              {[
                { t: "Memory & roots", d: "The French section: memorial sites, library and practical guides.", i: ScrollText, href: "/memoire" },
                { t: "A living network", d: "Members, associations and events of the Beninese diaspora.", i: Users, href: "/communaute" },
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
                Get in <em>touch</em>
              </h3>
              <p className="mt-2 text-sm text-ink-2">
                Questions about the site or the network? Write to us through the contact form —
                your e-mail address is never displayed.
              </p>
              <Link href="/contact" className="mt-3 block w-full rounded bg-primary py-2 text-center text-sm font-bold text-white hover:bg-primary-dark">
                Contact form
              </Link>
            </div>
            <AdSlot slot="SIDE" section="en" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

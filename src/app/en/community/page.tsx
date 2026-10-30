import Link from "next/link";
import type { Metadata } from "next";
import type { AccountType } from "@prisma/client";
import { SiteHeader, SiteFooter, SectionTitle, AdSlot, PageBanner, LangSwitch } from "@/components/site/chrome";
import { db } from "@/lib/db";
import { publicProfileWhere } from "@/lib/content";

export const metadata: Metadata = {
  title: "The community",
  description: "Beninese people worldwide: members, companies, associations and artists, country by country. Free to join.",
};

/* English entry point to the community: real counts, links to the (French) directories,
   country pages and the skills network. */

export const revalidate = 900;

const TYPES: { type: AccountType; label: string; href: string; desc: string }[] = [
  { type: "MEMBER", label: "Members", href: "/communaute/membres", desc: "Beninese people and friends of Benin, by city and field of work." },
  { type: "COMPANY", label: "Companies", href: "/communaute/entreprises", desc: "Businesses founded or run by the diaspora." },
  { type: "ASSOCIATION", label: "Associations", href: "/communaute/associations", desc: "Diaspora organisations, country by country." },
  { type: "ARTIST", label: "Artists & bands", href: "/communaute/artistes", desc: "Musicians, dancers, visual artists, writers." },
];

export default async function CommunityPage() {
  const [counts, pays] = await Promise.all([
    Promise.all(TYPES.map(async (t) => ({ ...t, n: await db.profile.count({ where: publicProfileWhere({ user: { status: "ACTIVE", accountType: t.type } }) }) }))),
    db.profile.findMany({ where: { ...publicProfileWhere(), country: { not: null } }, distinct: ["country"], select: { country: true } }),
  ]);

  return (
    <div lang="en">
      <SiteHeader />
      <PageBanner
        pre="The"
        em="community"
        desc="Members, companies, associations, artists: four directories filled in by the members themselves, in every country where Beninese people live. Free to join; publications are reviewed before going live."
      >
        <Link href="/en/join" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">Create my free profile</Link>
        <LangSwitch fr="/communaute" en="/en/community" current="en" />
      </PageBanner>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <SectionTitle pre="Four" em="directories" />
              <div className="grid gap-4 sm:grid-cols-2">
                {counts.map((t) => (
                  <Link key={t.type} href={t.href} className="flex flex-col border border-line p-5 hover:border-primary hover:bg-primary-faint">
                    <div className="flex items-baseline justify-between">
                      <h2 className="font-display text-lg font-extrabold">{t.label}</h2>
                      <span className="font-display text-2xl font-black text-primary">{t.n.toLocaleString("en")}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-2">{t.desc}</p>
                    <span className="mt-3 text-xs font-bold uppercase text-primary">Open the directory (French) →</span>
                  </Link>
                ))}
              </div>
            </section>
            <section>
              <SectionTitle pre="By" em="country" href="/pays" />
              <p className="text-sm text-ink-2">
                Each country page gathers members, events, good addresses, job offers and useful contacts. {pays.length} countr{pays.length > 1 ? "ies" : "y"} so far.
              </p>
              <Link href="/pays" className="mt-3 inline-block rounded border-2 border-primary px-4 py-2 text-sm font-bold uppercase text-primary hover:bg-primary hover:text-white">Choose a country</Link>
            </section>
            <section>
              <SectionTitle pre="Skills for" em="Benin" href="/communaute/competences" />
              <p className="text-sm text-ink-2">Mentoring, short assignments, remote advice: members offer their expertise to projects in Benin, after review by the HCBE. Project leaders in Benin can describe what they need.</p>
              <Link href="/communaute/competences" className="mt-3 inline-block text-sm font-bold uppercase text-primary hover:underline">Skills of the diaspora (French) →</Link>
            </section>
            <section>
              <SectionTitle pre="People of" em="African descent" href="/en/roots" />
              <p className="text-sm text-ink-2">Benin has opened a path to nationality for people of African descent. Memorial sites, the official procedure and a network to help you come home.</p>
              <Link href="/en/roots" className="mt-3 inline-block text-sm font-bold uppercase text-primary hover:underline">Your Beninese roots →</Link>
            </section>
          </div>
          <aside className="space-y-8">
            <div className="border-2 border-primary bg-primary-faint p-4 text-center">
              <p className="font-display text-lg font-bold">Join, then publish</p>
              <p className="mt-1 text-sm text-ink-2">Free profile, visible in the directory, publications reviewed by the team.</p>
              <Link href="/en/join" className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">Sign up</Link>
            </div>
            <p className="text-xs text-muted">The member area and most pages are in French. Sign-up and sign-in are available in English.</p>
            <AdSlot slot="SIDE" section="communaute" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

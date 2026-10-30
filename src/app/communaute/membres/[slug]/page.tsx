import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter, AdSlot, KeywordChips } from "@/components/site/chrome";
import { db } from "@/lib/db";
import { ogImageUrl } from "@/lib/og";
import { SITE_URL } from "@/lib/site-url";
import { ShareButtons } from "@/components/site/share-buttons";
import { Avatar } from "@/components/site/avatar";
import { EXPERT_MODE_LABEL, expertModes } from "@/lib/competences";
import { CONTENT_LABEL, contentHref, profileHref } from "@/lib/routes";
import { auth } from "@/lib/auth";
import { RelayForm } from "@/components/site/relay-form";

/* Fiche profil membre (CDC §7.5) — données en base. Le contact passe par
   un formulaire relais (S3) : l'e-mail n'est jamais affiché. */

type Props = { params: Promise<{ slug: string }> };

const TYPE_LABEL = { MEMBER: "Membre", COMPANY: "Entreprise", ASSOCIATION: "Association", ARTIST: "Artiste" } as const;

async function getProfile(slug: string) {
  return db.profile.findFirst({
    where: { slug, user: { status: "ACTIVE" }, visibility: { path: ["directory"], equals: true } },
    include: {
      user: { select: { accountType: true, createdAt: true } },
      keywords: { include: { keyword: true } },
      contents: { where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 10 },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProfile((await params).slug);
  if (!p) return { title: "Membre introuvable" };
  const title = `${p.displayName} — ${TYPE_LABEL[p.user.accountType]}`;
  const image = ogImageUrl({ title: p.displayName, kind: TYPE_LABEL[p.user.accountType], place: [p.city, p.country].filter(Boolean).join(", ") });
  return { title, description: p.headline ?? undefined, openGraph: { type: "profile", title, images: [{ url: image, width: 1200, height: 630, alt: p.displayName }] } };
}

export default async function ProfilPage({ params }: Props) {
  const [profile, session] = await Promise.all([getProfile((await params).slug), auth()]);
  if (!profile) notFound();
  const viewerId = session?.user?.id ?? null;
  const isSelf = viewerId === profile.userId;

  const sectors = profile.keywords.filter((k) => k.keyword.family === "SECTOR").map((k) => k.keyword.name);
  const allKeywords = profile.keywords.map((k) => k.keyword.name);
  const lieu = [profile.city, profile.country].filter(Boolean).join(" · ");
  const prenom = profile.displayName.split(" ")[0];

  const similaires = await db.profile.findMany({
    where: {
      id: { not: profile.id },
      user: { status: "ACTIVE" },
      visibility: { path: ["directory"], equals: true },
      OR: [
        { country: profile.country ?? undefined },
        { keywords: { some: { keywordId: { in: profile.keywords.map((k) => k.keywordId) } } } },
      ],
    },
    take: 3,
    include: { keywords: { include: { keyword: true } } },
  });

  return (
    <>
      <SiteHeader />

      <div className="wax-bg bg-primary-darker py-8 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={profile.displayName} photo={profile.photo} size="lg" tone="accent" />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl font-black leading-tight">{profile.displayName}</h1>
              <p className="mt-1 text-sm uppercase tracking-wider text-white/80">
                {[lieu, profile.headline ?? sectors.join(", ")].filter(Boolean).join(" — ")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{TYPE_LABEL[profile.user.accountType]}</span>
                {profile.cvPublished && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">CV publié</span>}
                {profile.expertStatus === "APPROVED" && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary-dark">Expert validé par le HCBE</span>}
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-ink">
                  Membre depuis {profile.user.createdAt.getFullYear()}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <ShareButtons url={`${SITE_URL}/communaute/membres/${profile.slug}`} title={profile.displayName} compact />
              {!isSelf && (
                <a href="#ecrire" className="whitespace-nowrap rounded bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent-dark">
                  Écrire à {prenom}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            <section>
              <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">
                À <em>propos</em>
              </h2>
              <p className="max-w-2xl leading-relaxed text-ink">{profile.bio ?? "Ce membre n'a pas encore rédigé sa présentation."}</p>
              {allKeywords.length > 0 && (
                <div className="mt-4">
                  <KeywordChips keywords={allKeywords} />
                </div>
              )}
            </section>

            <section>
              <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">
                {profile.contents.length} contenu{profile.contents.length > 1 ? "s" : ""} <em>publié{profile.contents.length > 1 ? "s" : ""}</em>
              </h2>
              {profile.contents.length === 0 ? (
                <p className="text-sm text-muted">Aucune publication pour l&apos;instant.</p>
              ) : (
                <ul className="divide-y divide-line border border-line">
                  {profile.contents.map((c) => (
                    <li key={c.id} className="flex items-center gap-4 p-4 hover:bg-primary-faint">
                      <span className="shrink-0 whitespace-nowrap rounded bg-primary-light px-2 py-1 text-xs font-bold uppercase text-primary-dark">
                        {CONTENT_LABEL[c.type]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold leading-snug">
                          <Link href={contentHref(c.type, c.slug)} className="hover:text-primary">{c.title}</Link>
                        </p>
                        {c.publishedAt && (
                          <p className="mt-0.5 text-xs text-muted">
                            {c.publishedAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {profile.expertStatus === "APPROVED" && (
              <section className="border border-line p-5">
                <h2 className="section-title text-lg">Compétences pour <em>le Bénin</em></h2>
                <p className="mt-2 text-sm">
                  <span className="font-bold">{profile.expertDomain}</span>
                  {expertModes(profile.expertModes).length > 0 && <span className="text-ink-2"> · {expertModes(profile.expertModes).map((m) => EXPERT_MODE_LABEL[m]).join(", ")}</span>}
                </p>
                {profile.expertPitch && <p className="mt-2 whitespace-pre-line text-sm text-ink-2">{profile.expertPitch}</p>}
              </section>
            )}

            {!isSelf && (
              <section id="ecrire" className="border-2 border-primary p-4">
                <h2 className="section-title text-lg">Écrire à <em>{prenom}</em></h2>
                {viewerId ? (
                  <div className="mt-3"><RelayForm toProfileId={profile.id} label={`Envoyer à ${prenom}`} /></div>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-ink-2">Le contact passe par un formulaire relais : l&apos;e-mail de {prenom} n&apos;est jamais affiché. Réservé aux membres connectés.</p>
                    <Link href={`/connexion?callbackUrl=${encodeURIComponent(profileHref(profile.slug))}`} className="mt-3 inline-block rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">Se connecter pour écrire</Link>
                  </>
                )}
              </section>
            )}
            <p className="text-xs text-muted">
              Ce membre choisit ce qui est public, réservé aux membres ou privé. Le contact passe
              par un formulaire relais : son e-mail n&apos;est jamais affiché.
            </p>
          </div>

          <aside className="space-y-8">
            <div className="border-2 border-primary bg-primary-faint p-4 text-center">
              <p className="font-display text-lg font-bold">Vous aussi, existez ici</p>
              <p className="mt-1 text-sm text-ink-2">Créez votre profil gratuit et publiez vos contenus.</p>
              <Link href="/inscription" className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                Créer mon profil
              </Link>
            </div>
            {similaires.length > 0 && (
              <div>
                <h3 className="section-title mb-3 border-b-2 border-line pb-2 text-sm">
                  Membres <em>similaires</em>
                </h3>
                <ul className="space-y-3 text-sm">
                  {similaires.map((m) => (
                    <li key={m.id} className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary-dark">
                        {m.displayName[0]}
                      </span>
                      <div>
                        <Link href={profileHref(m.slug)} className="font-semibold hover:text-primary">{m.displayName}</Link>
                        <p className="card-location">
                          {[m.city, m.keywords.find((k) => k.keyword.family === "SECTOR")?.keyword.name].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <AdSlot slot="SIDE" section="communaute" />
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

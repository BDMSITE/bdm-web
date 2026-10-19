import Link from "next/link";
import Image from "next/image";
import type { ContentFull } from "@/lib/content";
import { CONTENT_LABEL, contentHref, keywordHref, profileHref } from "@/lib/routes";

/* Briques d'affichage des contenus réels : carte, liste, fiche, état vide.
   Pas d'image = pas de bloc image (aucun faux « photo »). */

export const fmtDate = (d: Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) =>
  d ? d.toLocaleDateString("fr-FR", opts) : "";

export function EmptyState({ title, text, href, cta }: { title: string; text: string; href?: string; cta?: string }) {
  return (
    <div className="border border-dashed border-line bg-paper-2 p-8 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">{text}</p>
      {href && cta && (
        <Link href={href} className="mt-4 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
          {cta}
        </Link>
      )}
    </div>
  );
}

export function contentMeta(item: ContentFull): string[] {
  const lieu = [item.city, item.country].filter(Boolean).join(" · ");
  const m: string[] = [];
  if (item.event) m.push(fmtDate(item.event.startsAt, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }));
  if (item.job) m.push(item.job.contractType);
  if (item.place) m.push(item.place.category);
  if (item.classified) m.push(item.classified.category + (item.classified.price ? ` · ${item.classified.price}` : ""));
  if (item.deal?.validTo) m.push(`jusqu'au ${fmtDate(item.deal.validTo)}`);
  if (lieu) m.push(lieu);
  return m;
}

export function ContentCard({ item, compact = false }: { item: ContentFull; compact?: boolean }) {
  const href = contentHref(item.type, item.slug);
  return (
    <article className={`card-soft flex flex-col border border-line bg-paper ${compact ? "p-4" : ""}`}>
      {!compact && item.cover && (
        <Link href={href} className="relative block aspect-[16/10] bg-paper-2">
          <Image src={item.cover} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
        </Link>
      )}
      <div className={compact ? "" : "p-4"}>
        <span className="inline-block bg-accent px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink">
          {CONTENT_LABEL[item.type]}
        </span>
        <h3 className="mt-2 font-display font-bold leading-snug">
          <Link href={href} className="hover:text-primary">{item.title}</Link>
        </h3>
        {!compact && item.excerpt && <p className="mt-1.5 line-clamp-3 text-sm text-ink-2">{item.excerpt}</p>}
        <p className="card-location mt-2">{contentMeta(item).join(" — ")}</p>
      </div>
    </article>
  );
}

export function ContentList({ items, empty, cols = 3 }: { items: ContentFull[]; empty: { title: string; text: string; href?: string; cta?: string }; cols?: 2 | 3 }) {
  if (items.length === 0) return <EmptyState {...empty} />;
  return (
    <div className={`grid gap-5 ${cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
      {items.map((it) => <ContentCard key={it.id} item={it} />)}
    </div>
  );
}

function Body({ text }: { text: string }) {
  return (
    <div className="mt-6 space-y-5 text-[1.05rem] leading-relaxed text-ink">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">{p.replace(/\*\*/g, "")}</p>
      ))}
    </div>
  );
}

function Details({ item }: { item: ContentFull }) {
  const rows: [string, string | null | undefined][] = [];
  if (item.job) rows.push(["Contrat", item.job.contractType], ["Rémunération", item.job.salary]);
  if (item.event) rows.push(["Date", fmtDate(item.event.startsAt, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })], ["Lieu", item.event.isOnline ? "En ligne" : item.event.venue], ["Catégorie", item.event.category]);
  if (item.place) rows.push(["Catégorie", item.place.category], ["Adresse", item.place.address], ["Horaires", item.place.hours], ["Téléphone", item.place.phone]);
  if (item.classified) rows.push(["Catégorie", item.classified.category], ["Prix", item.classified.price]);
  if (item.deal) rows.push(["Code", item.deal.promoCode], ["Conditions", item.deal.conditions], ["Valable jusqu'au", item.deal.validTo ? fmtDate(item.deal.validTo) : null]);
  const lieu = [item.city, item.country].filter(Boolean).join(" · ");
  if (lieu) rows.push(["Localisation", lieu]);
  const shown = rows.filter(([, v]) => v);
  if (shown.length === 0) return null;
  return (
    <dl className="mt-6 grid gap-x-8 gap-y-3 border border-line bg-paper-2 p-4 text-sm sm:grid-cols-2">
      {shown.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">{k}</dt>
          <dd className="mt-0.5">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ContentDetail({ item, related }: { item: ContentFull; related: ContentFull[] }) {
  const owner = item.ownerProfile;
  const cta =
    item.type === "JOB" || item.type === "INTERNSHIP" ? "Postuler" :
    item.type === "EVENT" ? "Contacter l'organisateur" :
    item.type === "CLASSIFIED" || item.type === "HELP_REQUEST" ? "Répondre à l'annonce" :
    item.type === "PLACE" ? "Signaler une erreur" : null;

  return (
    <article className="min-w-0">
      <span className="inline-block bg-accent px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink">{CONTENT_LABEL[item.type]}</span>
      <h1 className="font-display mt-3 text-3xl font-black leading-tight md:text-4xl">{item.title}</h1>
      {item.excerpt && <p className="mt-3 text-lg leading-relaxed text-ink-2">{item.excerpt}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-line py-3 text-sm text-muted">
        {owner && (
          <span>
            Par <Link href={profileHref(owner.slug)} className="font-bold text-ink hover:text-primary">{owner.displayName}</Link>
          </span>
        )}
        {item.publishedAt && <span>Publié le {fmtDate(item.publishedAt)}</span>}
        {(item.city || item.country) && <span className="card-location">{[item.city, item.country].filter(Boolean).join(" · ")}</span>}
      </div>

      {item.cover && (
        <figure className="relative mt-6 aspect-video overflow-hidden border border-line bg-paper-2">
          <Image src={item.cover} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
        </figure>
      )}

      <Details item={item} />
      {item.body && <Body text={item.body} />}

      {cta && (
        <div className="mt-8 border-2 border-primary p-4">
          <p className="font-display text-lg font-bold">{cta}</p>
          <p className="mt-1 text-sm text-ink-2">Le contact passe par un formulaire relais : votre e-mail n&apos;est jamais affiché. Réservé aux membres connectés.</p>
          <Link href={`/connexion?callbackUrl=${encodeURIComponent(contentHref(item.type, item.slug))}`} className="mt-3 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
            Se connecter pour continuer
          </Link>
        </div>
      )}

      {item.keywords.length > 0 && (
        <div className="mt-8 border-t border-line pt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Mots-clés</p>
          <div className="flex flex-wrap gap-2">
            {item.keywords.map((k) => (
              <Link key={k.keywordId} href={keywordHref(k.keyword.slug)} className="whitespace-nowrap rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark hover:bg-primary hover:text-white">
                {k.keyword.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title mb-4 border-b-2 border-line pb-2 text-lg">À voir <em>aussi</em></h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((r) => <ContentCard key={r.id} item={r} compact />)}
          </div>
        </section>
      )}
    </article>
  );
}

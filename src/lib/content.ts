import type { ContentType, Prisma, AccountType } from "@prisma/client";
import { db } from "./db";

/* Accès aux contenus publiés et aux profils actifs. Toutes les pages publiques
   passent par ici : jamais de donnée inventée, un état vide quand il n'y a rien. */

export const CONTENT_INCLUDE = {
  job: true,
  event: true,
  classified: true,
  place: true,
  deal: true,
  keywords: { include: { keyword: true } },
  ownerProfile: { select: { displayName: true, slug: true, user: { select: { accountType: true } } } },
} satisfies Prisma.ContentInclude;

export type ContentFull = Prisma.ContentGetPayload<{ include: typeof CONTENT_INCLUDE }>;

export type ListParams = {
  types: ContentType[];
  q?: string;
  country?: string;
  city?: string;
  keyword?: string;
  category?: string;
  contractType?: string;
  upcoming?: boolean;
  featured?: boolean;
  take?: number;
  skip?: number;
};

const clean = (s?: string) => (s ?? "").trim().slice(0, 100) || undefined;

export function contentWhere(p: ListParams): Prisma.ContentWhereInput {
  const q = clean(p.q);
  const country = clean(p.country);
  const city = clean(p.city);
  const keyword = clean(p.keyword);
  const category = clean(p.category);
  const contractType = clean(p.contractType);
  const ci = { mode: "insensitive" as const };
  return {
    type: { in: p.types },
    status: "PUBLISHED",
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    ...(q && {
      AND: [{ OR: [{ title: { contains: q, ...ci } }, { excerpt: { contains: q, ...ci } }, { city: { contains: q, ...ci } }, { keywords: { some: { keyword: { name: { contains: q, ...ci } } } } }] }],
    }),
    ...(country && { country }),
    ...(city && { city }),
    ...(keyword && { keywords: { some: { keyword: { slug: keyword } } } }),
    ...(category && { OR: [{ place: { category } }, { classified: { category } }, { event: { category } }] }),
    ...(contractType && { job: { contractType } }),
    ...(p.upcoming && { event: { startsAt: { gte: new Date(Date.now() - 864e5) } } }),
    ...(p.featured && { featured: true }),
  };
}

export async function listContents(p: ListParams) {
  const where = contentWhere(p);
  const isEvent = p.types.every((t) => t === "EVENT");
  const [items, total] = await Promise.all([
    db.content.findMany({
      where,
      include: CONTENT_INCLUDE,
      orderBy: isEvent ? { event: { startsAt: "asc" } } : [{ featured: "desc" }, { publishedAt: "desc" }],
      take: p.take ?? 24,
      skip: p.skip ?? 0,
    }),
    db.content.count({ where }),
  ]);
  return { items, total };
}

export async function getContent(slug: string) {
  return db.content.findFirst({ where: { slug, status: "PUBLISHED" }, include: CONTENT_INCLUDE });
}

export async function relatedContents(item: ContentFull, take = 3) {
  return db.content.findMany({
    where: {
      id: { not: item.id },
      status: "PUBLISHED",
      OR: [
        { type: item.type },
        { keywords: { some: { keywordId: { in: item.keywords.map((k) => k.keywordId) } } } },
      ],
    },
    include: CONTENT_INCLUDE,
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function listCountries(types: ContentType[]) {
  const rows = await db.content.findMany({
    where: { type: { in: types }, status: "PUBLISHED", country: { not: null } },
    distinct: ["country"],
    select: { country: true },
    orderBy: { country: "asc" },
  });
  return rows.map((r) => r.country!).filter(Boolean);
}

export async function listCategories(type: ContentType) {
  const content = { type, status: "PUBLISHED" as const };
  const sel = { distinct: ["category" as const], select: { category: true } };
  const rows =
    type === "PLACE" || type === "MEMORY_PLACE" ? await db.placeDetails.findMany({ where: { content }, ...sel })
    : type === "CLASSIFIED" ? await db.classifiedDetails.findMany({ where: { content }, ...sel })
    : type === "EVENT" ? await db.eventDetails.findMany({ where: { content }, ...sel })
    : [];
  return rows.map((r) => r.category).filter((c): c is string => Boolean(c)).sort((a, b) => a.localeCompare(b, "fr"));
}

export async function listContractTypes() {
  const rows = await db.jobDetails.findMany({
    where: { content: { status: "PUBLISHED" } },
    distinct: ["contractType"],
    select: { contractType: true },
  });
  return rows.map((r) => r.contractType).sort();
}

/* Profils publics (annuaire, entreprises, associations, artistes) */
export const PROFILE_INCLUDE = {
  user: { select: { accountType: true, createdAt: true } },
  keywords: { include: { keyword: true } },
  company: true,
  association: true,
  artist: true,
} satisfies Prisma.ProfileInclude;

export type ProfileFull = Prisma.ProfileGetPayload<{ include: typeof PROFILE_INCLUDE }>;

export function publicProfileWhere(extra: Prisma.ProfileWhereInput = {}): Prisma.ProfileWhereInput {
  return { user: { status: "ACTIVE" }, visibility: { path: ["directory"], equals: true }, ...extra };
}

export async function listProfiles(p: { accountType?: AccountType; q?: string; country?: string; keyword?: string; take?: number }) {
  const q = clean(p.q);
  const ci = { mode: "insensitive" as const };
  const where = publicProfileWhere({
    ...(p.accountType && { user: { status: "ACTIVE", accountType: p.accountType } }),
    ...(q && { OR: [{ displayName: { contains: q, ...ci } }, { bio: { contains: q, ...ci } }, { city: { contains: q, ...ci } }, { keywords: { some: { keyword: { name: { contains: q, ...ci } } } } }] }),
    ...(clean(p.country) && { country: clean(p.country) }),
    ...(clean(p.keyword) && { keywords: { some: { keyword: { slug: clean(p.keyword) } } } }),
  });
  const [items, total] = await Promise.all([
    db.profile.findMany({ where, include: PROFILE_INCLUDE, orderBy: { displayName: "asc" }, take: p.take ?? 24 }),
    db.profile.count({ where }),
  ]);
  return { items, total };
}

/* Chiffres réels du site (jamais de nombre inventé) */
export async function siteCounts() {
  const where = publicProfileWhere();
  const [members, countries, contents] = await Promise.all([
    db.profile.count({ where }),
    db.profile.findMany({ where: { ...where, country: { not: null } }, distinct: ["country"], select: { country: true } }),
    db.content.groupBy({ by: ["type"], where: { status: "PUBLISHED" }, _count: { _all: true } }),
  ]);
  return {
    members,
    countries: countries.length,
    byType: Object.fromEntries(contents.map((c) => [c.type, c._count._all])) as Partial<Record<ContentType, number>>,
  };
}

/* Villes des membres actifs géolocalisés, pour la carte */
export async function memberCities() {
  const rows = await db.profile.groupBy({
    by: ["city", "country", "lat", "lng"],
    where: { ...publicProfileWhere(), lat: { not: null }, lng: { not: null } },
    _count: { _all: true },
  });
  return rows.map((r) => ({ name: r.city ?? r.country ?? "", n: r._count._all, lat: r.lat!, lng: r.lng! })).filter((r) => r.name);
}

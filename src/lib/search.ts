import { Meilisearch } from "meilisearch";
import type { ContentType, Prisma } from "@prisma/client";
import { db } from "./db";

/* Recherche : Meilisearch quand MEILI_HOST est défini (tolérance aux fautes,
   facettes), sinon repli Postgres via Prisma (ILIKE) — zéro service payant
   en prod tant que Meilisearch n'est pas hébergé. Même forme de résultat. */

export type ContentDoc = {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  city: string | null;
  country: string | null;
  keywords: string[];
  publishedAt: number;
};

export type ProfileDoc = {
  id: string;
  displayName: string;
  slug: string;
  bio: string | null;
  city: string | null;
  country: string | null;
  accountType: string;
  keywords: string[];
};

export type SearchResult = {
  engine: "meilisearch" | "postgres";
  contents: { hits: ContentDoc[]; facets: Record<string, number>; total: number };
  profiles: { hits: ProfileDoc[]; total: number };
};

const client = process.env.MEILI_HOST
  ? new Meilisearch({ host: process.env.MEILI_HOST, apiKey: process.env.MEILI_MASTER_KEY })
  : null;

const contentIndex = client?.index<ContentDoc>("content") ?? null;
const profileIndex = client?.index<ProfileDoc>("profiles") ?? null;

const CONTENT_INCLUDE = { keywords: { include: { keyword: true } } } satisfies Prisma.ContentInclude;
const PROFILE_INCLUDE = { user: true, keywords: { include: { keyword: true } } } satisfies Prisma.ProfileInclude;

type ContentWithKeywords = Prisma.ContentGetPayload<{ include: typeof CONTENT_INCLUDE }>;
type ProfileWithKeywords = Prisma.ProfileGetPayload<{ include: typeof PROFILE_INCLUDE }>;

export async function search(query: string, type?: ContentType | "PROFILE"): Promise<SearchResult> {
  const typeFilter = type && type !== "PROFILE" ? type : undefined;
  const wantContents = type !== "PROFILE";
  const wantProfiles = !typeFilter;

  if (contentIndex && profileIndex) {
    const [c, all, p] = await Promise.all([
      contentIndex.search(query, {
        limit: wantContents ? 30 : 0,
        filter: typeFilter ? `type = ${typeFilter}` : undefined,
        sort: ["publishedAt:desc"],
      }),
      // facettes toujours calculées sans filtre, pour garder toutes les pastilles
      contentIndex.search(query, { limit: 0, facets: ["type"] }),
      wantProfiles ? profileIndex.search(query, { limit: 12 }) : null,
    ]);
    const facets = (all.facetDistribution?.type ?? {}) as Record<string, number>;
    return {
      engine: "meilisearch",
      contents: { hits: c.hits, facets, total: typeFilter ? (facets[typeFilter] ?? 0) : Object.values(facets).reduce((a, b) => a + b, 0) },
      profiles: { hits: p?.hits ?? [], total: p?.estimatedTotalHits ?? 0 },
    };
  }

  const q = { contains: query, mode: "insensitive" as const };
  const contentMatch: Prisma.ContentWhereInput = {
    status: "PUBLISHED",
    OR: [
      { title: q }, { excerpt: q }, { body: q }, { city: q }, { country: q },
      { keywords: { some: { keyword: { name: q } } } },
    ],
  };
  const profileMatch: Prisma.ProfileWhereInput = {
    user: { status: "ACTIVE" },
    visibility: { path: ["directory"], equals: true },
    OR: [{ displayName: q }, { bio: q }, { city: q }, { country: q }, { keywords: { some: { keyword: { name: q } } } }],
  };

  const [hits, groups, profiles, profileTotal] = await Promise.all([
    wantContents
      ? db.content.findMany({ where: { ...contentMatch, ...(typeFilter && { type: typeFilter }) }, orderBy: { publishedAt: "desc" }, take: 30, include: CONTENT_INCLUDE })
      : [],
    db.content.groupBy({ by: ["type"], where: contentMatch, _count: { _all: true } }),
    wantProfiles ? db.profile.findMany({ where: profileMatch, take: 12, include: PROFILE_INCLUDE }) : [],
    wantProfiles ? db.profile.count({ where: profileMatch }) : 0,
  ]);
  const facets = Object.fromEntries(groups.map((g) => [g.type, g._count._all]));
  return {
    engine: "postgres",
    contents: { hits: hits.map(toContentDoc), facets, total: typeFilter ? (facets[typeFilter] ?? 0) : groups.reduce((a, g) => a + g._count._all, 0) },
    profiles: { hits: profiles.map(toProfileDoc), total: profileTotal },
  };
}

export async function configureIndexes() {
  if (!client) return;
  await client.createIndex("content", { primaryKey: "id" }).catch(() => {});
  await client.createIndex("profiles", { primaryKey: "id" }).catch(() => {});
  await contentIndex!.updateSettings({
    searchableAttributes: ["title", "excerpt", "body", "keywords", "city", "country"],
    filterableAttributes: ["type", "country", "city", "keywords"],
    sortableAttributes: ["publishedAt"],
  });
  await profileIndex!.updateSettings({
    searchableAttributes: ["displayName", "bio", "keywords", "city", "country"],
    filterableAttributes: ["accountType", "country", "city", "keywords"],
  });
}

export async function indexContent(id: string) {
  if (!contentIndex) return;
  const c = await db.content.findUnique({ where: { id }, include: CONTENT_INCLUDE });
  if (!c || c.status !== "PUBLISHED") {
    await contentIndex.deleteDocument(id).catch(() => {});
    return;
  }
  await contentIndex.addDocuments([toContentDoc(c)]);
}

export async function indexProfile(id: string) {
  if (!profileIndex) return;
  const p = await db.profile.findUnique({ where: { id }, include: PROFILE_INCLUDE });
  if (!p || p.user.status !== "ACTIVE") {
    await profileIndex.deleteDocument(id).catch(() => {});
    return;
  }
  await profileIndex.addDocuments([toProfileDoc(p)]);
}

export async function reindexAll() {
  if (!contentIndex || !profileIndex) return { contents: 0, profiles: 0 };
  await configureIndexes();
  const contents = await db.content.findMany({ where: { status: "PUBLISHED" }, include: CONTENT_INCLUDE });
  const profiles = await db.profile.findMany({ where: { user: { status: "ACTIVE" } }, include: PROFILE_INCLUDE });
  await contentIndex.deleteAllDocuments();
  await profileIndex.deleteAllDocuments();
  const t1 = await contentIndex.addDocuments(contents.map(toContentDoc));
  const t2 = await profileIndex.addDocuments(profiles.map(toProfileDoc));
  await client!.tasks.waitForTasks([t1.taskUid, t2.taskUid]);
  return { contents: contents.length, profiles: profiles.length };
}

function toContentDoc(c: ContentWithKeywords): ContentDoc {
  return {
    id: c.id,
    type: c.type,
    title: c.title,
    slug: c.slug,
    excerpt: c.excerpt,
    body: c.body,
    city: c.city,
    country: c.country,
    keywords: c.keywords.map((k) => k.keyword.name),
    publishedAt: c.publishedAt?.getTime() ?? 0,
  };
}

function toProfileDoc(p: ProfileWithKeywords): ProfileDoc {
  return {
    id: p.id,
    displayName: p.displayName,
    slug: p.slug,
    bio: p.bio,
    city: p.city,
    country: p.country,
    accountType: p.user.accountType,
    keywords: p.keywords.map((k) => k.keyword.name),
  };
}

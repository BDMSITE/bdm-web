import { Meilisearch } from "meilisearch";
import type { ContentType, Prisma } from "@prisma/client";
import { db } from "./db";

/* Recherche Meilisearch : deux index, `content` (tout contenu publié) et
   `profiles` (annuaire). Indexation à la publication, réindexation complète
   via `pnpm search:reindex`. Sans MEILI_HOST, les fonctions sont inertes. */

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

const client = process.env.MEILI_HOST
  ? new Meilisearch({ host: process.env.MEILI_HOST, apiKey: process.env.MEILI_MASTER_KEY })
  : null;

export const contentIndex = client?.index<ContentDoc>("content") ?? null;
export const profileIndex = client?.index<ProfileDoc>("profiles") ?? null;

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
  const c = await db.content.findUnique({ where: { id }, include: { keywords: { include: { keyword: true } } } });
  if (!c || c.status !== "PUBLISHED") {
    await contentIndex.deleteDocument(id).catch(() => {});
    return;
  }
  await contentIndex.addDocuments([toContentDoc(c)]);
}

export async function indexProfile(id: string) {
  if (!profileIndex) return;
  const p = await db.profile.findUnique({ where: { id }, include: { user: true, keywords: { include: { keyword: true } } } });
  if (!p || p.user.status !== "ACTIVE") {
    await profileIndex.deleteDocument(id).catch(() => {});
    return;
  }
  await profileIndex.addDocuments([toProfileDoc(p)]);
}

export async function reindexAll() {
  if (!contentIndex || !profileIndex) return { contents: 0, profiles: 0 };
  await configureIndexes();
  const contents = await db.content.findMany({ where: { status: "PUBLISHED" }, include: { keywords: { include: { keyword: true } } } });
  const profiles = await db.profile.findMany({ where: { user: { status: "ACTIVE" } }, include: { user: true, keywords: { include: { keyword: true } } } });
  await contentIndex.deleteAllDocuments();
  await profileIndex.deleteAllDocuments();
  const t1 = await contentIndex.addDocuments(contents.map(toContentDoc));
  const t2 = await profileIndex.addDocuments(profiles.map(toProfileDoc));
  await client!.tasks.waitForTasks([t1.taskUid, t2.taskUid]);
  return { contents: contents.length, profiles: profiles.length };
}

type ContentWithKeywords = Prisma.ContentGetPayload<{ include: { keywords: { include: { keyword: true } } } }>;
type ProfileWithKeywords = Prisma.ProfileGetPayload<{ include: { user: true; keywords: { include: { keyword: true } } } }>;

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

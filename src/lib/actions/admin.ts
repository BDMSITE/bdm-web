"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { indexContent } from "@/lib/search";
import { contentHref, SECTION } from "@/lib/routes";

/* Actions du back-office. Chaque action : session vérifiée (rôle rédaction,
   modération ou admin), entrées validées par zod, écriture tracée dans AuditLog. */

const STAFF = new Set(["EDITOR", "MODERATOR", "ADMIN"]);

export type AdminActionState = { ok?: boolean; error?: string; message?: string };

async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id || !STAFF.has(session.user.role ?? "")) return null;
  return session.user;
}

const REFUS = { error: "Accès réservé à l'administration." } as const;

function audit(userId: string, action: string, entity: string, entityId: string | null, meta?: Prisma.InputJsonValue) {
  return db.auditLog.create({ data: { userId, action, entity, entityId, meta } });
}

function firstIssue(e: z.ZodError) {
  return e.issues[0]?.message ?? "Données invalides.";
}

/* ---------- Modération : valider / refuser un contenu ---------- */

const moderationSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["publish", "reject"]),
});

export async function moderateContentAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireStaff();
  if (!user) return REFUS;

  const parsed = moderationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { id, decision } = parsed.data;

  const content = await db.content.findUnique({ where: { id }, select: { id: true, type: true, slug: true, status: true, title: true } });
  if (!content) return { error: "Contenu introuvable." };
  if (content.status !== "IN_MODERATION") return { error: "Ce contenu n'est plus en modération." };

  if (decision === "publish") {
    await db.content.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    await audit(user.id, "content.publish", "Content", id, { title: content.title, type: content.type });
  } else {
    await db.content.update({ where: { id }, data: { status: "REJECTED" } });
    await audit(user.id, "content.reject", "Content", id, { title: content.title, type: content.type });
  }
  await indexContent(id).catch(() => {});

  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath(SECTION[content.type]);
  revalidatePath(contentHref(content.type, content.slug));
  return { ok: true, message: decision === "publish" ? "Contenu publié." : "Contenu refusé." };
}

/* ---------- Publier / archiver un contenu (emploi, services) ---------- */

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PUBLISHED", "ARCHIVED"]),
});

export async function setContentStatusAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireStaff();
  if (!user) return REFUS;

  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { id, status } = parsed.data;

  const content = await db.content.findUnique({ where: { id }, select: { id: true, type: true, slug: true, status: true, title: true, publishedAt: true } });
  if (!content) return { error: "Contenu introuvable." };
  if (content.status === status) return { error: "Le contenu est déjà dans cet état." };

  await db.content.update({
    where: { id },
    data: status === "PUBLISHED" ? { status, publishedAt: content.publishedAt ?? new Date() } : { status },
  });
  await audit(user.id, status === "PUBLISHED" ? "content.publish" : "content.archive", "Content", id, {
    title: content.title,
    type: content.type,
    from: content.status,
  });
  await indexContent(id).catch(() => {});

  revalidatePath("/admin");
  revalidatePath("/admin/emploi");
  revalidatePath("/admin/services");
  revalidatePath("/admin/memoire");
  revalidatePath(SECTION[content.type]);
  revalidatePath(contentHref(content.type, content.slug));
  return { ok: true, message: status === "PUBLISHED" ? "Contenu publié." : "Contenu archivé." };
}

/* ---------- Rédaction : nouvel article ---------- */

const articleSchema = z.object({
  title: z.string().trim().min(5, "Titre trop court (5 caractères minimum)").max(160, "Titre limité à 160 caractères"),
  excerpt: z.string().trim().max(400, "Chapô limité à 400 caractères"),
  body: z.string().trim().min(20, "Le corps de l'article est trop court").max(50_000, "Article trop long"),
  country: z.string().trim().max(80),
  city: z.string().trim().max(80),
  keywords: z.string().max(500),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

async function uniqueSlug(base: string) {
  const root = slugify(base) || "article";
  let slug = root;
  for (let i = 2; await db.content.findUnique({ where: { slug }, select: { id: true } }); i++) {
    slug = `${root}-${i}`;
  }
  return slug;
}

export async function createArticleAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireStaff();
  if (!user) return REFUS;

  const parsed = articleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const d = parsed.data;

  const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const keywordNames = [...new Set(d.keywords.split(",").map((k) => k.trim()).filter(Boolean))].slice(0, 15);
  const slug = await uniqueSlug(d.title);

  const created = await db.content.create({
    data: {
      type: "ARTICLE",
      title: d.title,
      slug,
      excerpt: d.excerpt || null,
      body: d.body,
      country: d.country || null,
      city: d.city || null,
      status: d.status,
      publishedAt: d.status === "PUBLISHED" ? new Date() : null,
      ownerProfileId: profile?.id ?? null,
      keywords: {
        create: keywordNames.map((name) => ({
          keyword: {
            connectOrCreate: {
              where: { slug: slugify(name) },
              create: { name, slug: slugify(name), family: "THEME" },
            },
          },
        })),
      },
    },
    select: { id: true, slug: true },
  });

  await audit(user.id, "content.create", "Content", created.id, { title: d.title, type: "ARTICLE", status: d.status });
  if (d.status === "PUBLISHED") await indexContent(created.id).catch(() => {});

  revalidatePath("/admin");
  revalidatePath("/admin/redaction");
  revalidatePath("/magazine");
  revalidatePath("/");
  return {
    ok: true,
    message: d.status === "PUBLISHED" ? `Article publié : /magazine/${created.slug}` : `Brouillon enregistré (${created.slug}).`,
  };
}

/* ---------- Communauté : suspendre / réactiver un compte ---------- */

const userStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export async function setUserStatusAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireStaff();
  if (!user) return REFUS;

  const parsed = userStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { id, status } = parsed.data;

  if (id === user.id) return { error: "Impossible de modifier votre propre compte." };
  const target = await db.user.findUnique({ where: { id }, select: { id: true, status: true, role: true, email: true } });
  if (!target) return { error: "Compte introuvable." };
  if (target.role === "ADMIN" && user.role !== "ADMIN") return { error: "Seul un administrateur peut agir sur un compte administrateur." };
  if (target.status === "DELETED") return { error: "Ce compte a été supprimé." };
  if (target.status === status) return { error: "Le compte est déjà dans cet état." };

  await db.user.update({ where: { id }, data: { status } });
  await audit(user.id, status === "SUSPENDED" ? "user.suspend" : "user.reactivate", "User", id, { from: target.status });

  revalidatePath("/admin");
  revalidatePath("/admin/communaute");
  revalidatePath("/communaute");
  return { ok: true, message: status === "SUSPENDED" ? "Compte suspendu." : "Compte réactivé." };
}

/* ---------- Mots-clés : ajout ---------- */

const keywordSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(60, "Nom limité à 60 caractères"),
  family: z.enum(["SECTOR", "PLACE", "THEME"]),
});

export async function createKeywordAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireStaff();
  if (!user) return REFUS;

  const parsed = keywordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { name, family } = parsed.data;

  const slug = slugify(name);
  if (!slug) return { error: "Nom invalide." };
  const existing = await db.keyword.findUnique({ where: { slug }, select: { name: true } });
  if (existing) return { error: `Le mot-clé « ${existing.name} » existe déjà.` };

  const created = await db.keyword.create({ data: { name, slug, family }, select: { id: true } });
  await audit(user.id, "keyword.create", "Keyword", created.id, { name, family });

  revalidatePath("/admin/mots-cles");
  return { ok: true, message: `Mot-clé « ${name} » ajouté.` };
}

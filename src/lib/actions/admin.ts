"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, type ContentType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { indexContent } from "@/lib/search";
import { geocode } from "@/lib/geocode";
import { contentHref, SECTION } from "@/lib/routes";
import { publishFields, refinePublish, parseKeywords, keywordsCreate, detailValues } from "@/lib/publier-schema";
import { ADMIN_CONTENT_TYPES, ADMIN_STATUSES } from "@/components/admin/ui";
import { SOCIAL_NETWORKS, NUMBER_SETTINGS } from "@/lib/settings";

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

/* ---------- Modération : traiter un signalement ---------- */

const reportSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["close", "remove"]),
});

export async function resolveReportAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireStaff();
  if (!user) return REFUS;

  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { id, decision } = parsed.data;

  const report = await db.report.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      reason: true,
      content: { select: { id: true, type: true, slug: true, status: true, title: true } },
    },
  });
  if (!report) return { error: "Signalement introuvable." };
  if (report.status !== "open") return { error: "Ce signalement a déjà été traité." };

  if (decision === "remove") {
    const content = report.content;
    if (!content) return { error: "Le contenu signalé n'existe plus : clôturez le signalement sans suite." };
    // Le retrait du contenu règle aussi les autres signalements ouverts qui le visent.
    await db.$transaction([
      db.content.update({ where: { id: content.id }, data: { status: "ARCHIVED" } }),
      db.report.updateMany({ where: { contentId: content.id, status: "open" }, data: { status: "closed" } }),
    ]);
    await audit(user.id, "report.remove", "Report", id, { contentId: content.id, title: content.title, type: content.type, from: content.status, reason: report.reason });
    await indexContent(content.id).catch(() => {});
    revalidatePath(SECTION[content.type]);
    revalidatePath(contentHref(content.type, content.slug));
    revalidatePath("/");
  } else {
    await db.report.update({ where: { id }, data: { status: "closed" } });
    await audit(user.id, "report.close", "Report", id, { contentId: report.content?.id ?? null, title: report.content?.title ?? null, reason: report.reason });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  return { ok: true, message: decision === "remove" ? "Contenu retiré et signalement clôturé." : "Signalement clôturé sans suite." };
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

/* ---------- Bandeau « En direct » : épingler / désépingler un contenu ---------- */

const featuredSchema = z.object({ id: z.string().min(1) });

export async function toggleFeaturedAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireStaff();
  if (!user) return REFUS;

  const parsed = featuredSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { id } = parsed.data;

  const content = await db.content.findUnique({ where: { id }, select: { id: true, type: true, slug: true, status: true, title: true, featured: true } });
  if (!content) return { error: "Contenu introuvable." };
  const featured = !content.featured;
  if (featured && content.status !== "PUBLISHED") return { error: "Seul un contenu en ligne peut être épinglé." };

  await db.content.update({ where: { id }, data: { featured } });
  await audit(user.id, "content.feature", "Content", id, { title: content.title, type: content.type, featured });
  await indexContent(id).catch(() => {});

  // Le bandeau est rendu dans l'en-tête de toutes les pages publiques.
  revalidatePath("/", "layout");
  revalidatePath("/admin/direct");
  revalidatePath("/admin/redaction");
  revalidatePath(`/admin/contenus/${id}`);
  return { ok: true, message: featured ? "Contenu épinglé dans le bandeau." : "Contenu retiré des épinglés." };
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

async function uniqueSlug(base: string, fallback = "article") {
  const root = slugify(base).slice(0, 80) || fallback;
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

/* ---------- Contenus : création et modification par l'équipe (tous types) ---------- */

/* Les listes ADMIN_CONTENT_TYPES / ADMIN_STATUSES vivent dans components/admin/ui.tsx
   (un module « use server » ne peut exporter que des fonctions). */

const vide = (s: unknown) => (typeof s === "string" && s.trim() ? s.trim() : undefined);
const optText = (max: number) => z.preprocess(vide, z.string().max(max).optional());
const optNumber = z.preprocess(vide, z.coerce.number().optional());
const optUrl = z.preprocess(vide, z.string().url("Adresse web invalide (commencez par https://)").max(500).optional());
const bool = z.preprocess((v) => v === "on" || v === "true", z.boolean());

/* Champs admin = champs du guichet Publier (règles partagées) + champs réservés à
   l'équipe : statut, lieu optionnel pour les articles, coordonnées, image, mise en
   avant, expiration et détails complets des tables JobDetails / EventDetails /
   PlaceDetails / DealDetails. */
const adminFields = publishFields.extend({
  excerpt: z.string().trim().max(400, "Chapô limité à 400 caractères"),
  body: z.string().trim().min(30, "Décrivez le contenu (30 caractères minimum)").max(50_000, "Texte trop long"),
  country: z.string().trim().max(80),
  city: z.string().trim().max(80),
  cover: optUrl,
  lat: optNumber,
  lng: optNumber,
  featured: bool,
  asAuthor: bool,
  expiresAt: z.preprocess(vide, z.string().optional()),
  // emploi
  salary: optText(80),
  applyMode: z.preprocess((v) => v || "relay_email", z.enum(["relay_email", "link", "form"])),
  applyTarget: optText(300),
  // événement
  endsAt: z.preprocess(vide, z.string().optional()),
  ticketUrl: optUrl,
  // adresse / lieu de mémoire
  phone: optText(40),
  hours: optText(200),
  verified: bool,
  // bon plan
  promoCode: optText(60),
  conditions: optText(1000),
  validFrom: z.preprocess(vide, z.string().optional()),
  validTo: z.preprocess(vide, z.string().optional()),
});
type AdminFields = z.infer<typeof adminFields>;

const ARTICLE_TYPES = new Set<string>(["ARTICLE", "MEMBER_ARTICLE"]);

function invalidDate(s: string | undefined) {
  return s !== undefined && Number.isNaN(new Date(s).getTime());
}

function refineAdmin(type: ContentType, d: AdminFields, ctx: z.RefinementCtx) {
  // Règles du guichet Publier (contrat, date d'événement, catégorie…)
  refinePublish(type, d, ctx);
  if (!ARTICLE_TYPES.has(type)) {
    if (!d.country) ctx.addIssue({ code: "custom", path: ["country"], message: "Pays obligatoire" });
    if (!d.city) ctx.addIssue({ code: "custom", path: ["city"], message: "Ville obligatoire" });
  }
  if (type === "MEMORY_PLACE" && !d.category) ctx.addIssue({ code: "custom", path: ["category"], message: "Catégorie obligatoire" });
  if ((d.lat === undefined) !== (d.lng === undefined)) ctx.addIssue({ code: "custom", path: ["lat"], message: "Indiquez latitude et longitude ensemble" });
  if (d.lat !== undefined && (d.lat < -90 || d.lat > 90)) ctx.addIssue({ code: "custom", path: ["lat"], message: "Latitude entre -90 et 90" });
  if (d.lng !== undefined && (d.lng < -180 || d.lng > 180)) ctx.addIssue({ code: "custom", path: ["lng"], message: "Longitude entre -180 et 180" });
  if ((type === "JOB" || type === "INTERNSHIP") && d.applyMode === "link" && !d.applyTarget) {
    ctx.addIssue({ code: "custom", path: ["applyTarget"], message: "Indiquez l'adresse web de candidature" });
  }
  if ((type === "JOB" || type === "INTERNSHIP") && d.applyMode === "relay_email" && d.applyTarget && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.applyTarget)) {
    ctx.addIssue({ code: "custom", path: ["applyTarget"], message: "E-mail relais invalide" });
  }
  for (const [path, value] of [["expiresAt", d.expiresAt], ["endsAt", d.endsAt], ["validFrom", d.validFrom], ["validTo", d.validTo]] as const) {
    if (invalidDate(value)) ctx.addIssue({ code: "custom", path: [path], message: "Date invalide" });
  }
  if (type === "EVENT" && d.endsAt && d.startsAt && new Date(d.endsAt) < new Date(d.startsAt)) {
    ctx.addIssue({ code: "custom", path: ["endsAt"], message: "La fin doit suivre le début" });
  }
  if (type === "DEAL" && d.validFrom && d.validTo && new Date(d.validTo) < new Date(d.validFrom)) {
    ctx.addIssue({ code: "custom", path: ["validTo"], message: "La fin de validité doit suivre le début" });
  }
}

const date = (s: string | undefined) => (s ? new Date(s) : null);

/* Valeurs des tables de détails : celles du guichet Publier + champs réservés à l'équipe. */
function adminDetailValues(type: ContentType, d: AdminFields) {
  const base = detailValues(type, d);
  if (base.job) return { job: { ...base.job, salary: d.salary ?? null, applyMode: d.applyMode, applyTarget: d.applyTarget ?? null } };
  if (base.event) return { event: { ...base.event, endsAt: date(d.endsAt), ticketUrl: d.ticketUrl ?? null } };
  if (base.place) return { place: { ...base.place, phone: d.phone ?? null, hours: d.hours ?? null, verified: d.verified } };
  if (base.classified) return { classified: base.classified };
  if (type === "MEMORY_PLACE") return { place: { category: d.category!, address: d.address ?? null, phone: d.phone ?? null, hours: d.hours ?? null, verified: d.verified } };
  if (type === "DEAL") return { deal: { promoCode: d.promoCode ?? null, conditions: d.conditions ?? null, validFrom: date(d.validFrom), validTo: date(d.validTo) } };
  return {};
}

/* Coordonnées : saisies, sinon géocodage ville + pays (null si échec, jamais d'erreur). */
async function resolveCoords(d: AdminFields) {
  if (d.lat !== undefined && d.lng !== undefined) return { lat: d.lat, lng: d.lng };
  if (!d.city) return { lat: null, lng: null };
  const g = await geocode(d.city, d.country || null);
  return g ?? { lat: null, lng: null };
}

function firstIssueWithField(e: z.ZodError) {
  const issue = e.issues[0];
  return { error: issue?.message ?? "Données invalides.", champ: issue ? String(issue.path[0] ?? "") : undefined };
}

export type AdminFormState = AdminActionState & { champ?: string };

function revalidateContent(type: ContentType, slug: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/redaction");
  revalidatePath("/admin/emploi");
  revalidatePath("/admin/services");
  revalidatePath("/admin/memoire");
  revalidatePath("/admin/moderation");
  revalidatePath(SECTION[type]);
  revalidatePath(contentHref(type, slug));
  revalidatePath("/");
}

const createContentSchema = adminFields
  .extend({
    type: z.enum(ADMIN_CONTENT_TYPES, { error: "Type de contenu invalide" }),
    status: z.enum(["DRAFT", "PUBLISHED"]),
  })
  .superRefine((d, ctx) => refineAdmin(d.type, d, ctx));

export async function createContentAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const user = await requireStaff();
  if (!user) return REFUS;

  const parsed = createContentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssueWithField(parsed.error);
  const d = parsed.data;

  const profile = d.asAuthor ? await db.profile.findUnique({ where: { userId: user.id }, select: { id: true } }) : null;
  const slug = await uniqueSlug(d.title, "contenu");
  const coords = await resolveCoords(d);

  const data: Prisma.ContentCreateInput = {
    type: d.type,
    title: d.title,
    slug,
    excerpt: d.excerpt || null,
    body: d.body,
    cover: d.cover ?? null,
    country: d.country || null,
    city: d.city || null,
    lat: coords.lat,
    lng: coords.lng,
    status: d.status,
    publishedAt: d.status === "PUBLISHED" ? new Date() : null,
    expiresAt: date(d.expiresAt),
    featured: d.featured,
    ...(profile && { ownerProfile: { connect: { id: profile.id } } }),
    keywords: { create: keywordsCreate(parseKeywords(d.keywords)) },
  };
  const v = adminDetailValues(d.type, d);
  if (v.job) data.job = { create: v.job };
  if (v.event) data.event = { create: v.event };
  if (v.place) data.place = { create: v.place };
  if (v.classified) data.classified = { create: v.classified };
  if (v.deal) data.deal = { create: v.deal };

  const created = await db.content.create({ data, select: { id: true, slug: true } });

  await audit(user.id, "content.create", "Content", created.id, { title: d.title, type: d.type, status: d.status });
  if (d.status === "PUBLISHED") await indexContent(created.id).catch(() => {});
  revalidateContent(d.type, created.slug);

  const geo = d.city && coords.lat === null ? " Géocodage impossible : indiquez les coordonnées à la main pour la carte." : "";
  return {
    ok: true,
    message: d.status === "PUBLISHED" ? `Contenu publié : ${contentHref(d.type, created.slug)}.${geo}` : `Brouillon enregistré (${created.slug}).${geo}`,
  };
}

const updateContentSchema = adminFields
  .extend({
    id: z.string().trim().min(1).max(64),
    status: z.enum(ADMIN_STATUSES),
  });

export async function updateContentAdminAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const user = await requireStaff();
  if (!user) return REFUS;

  const id = String(formData.get("id") ?? "");
  const content = await db.content.findUnique({ where: { id }, select: { id: true, type: true, slug: true, status: true, publishedAt: true, lat: true, lng: true } });
  if (!content) return { error: "Contenu introuvable." };

  const parsed = updateContentSchema.superRefine((d, ctx) => refineAdmin(content.type, d, ctx)).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssueWithField(parsed.error);
  const d = parsed.data;

  const coords = await resolveCoords(d);
  const data: Prisma.ContentUpdateInput = {
    title: d.title,
    excerpt: d.excerpt || null,
    body: d.body,
    cover: d.cover ?? null,
    country: d.country || null,
    city: d.city || null,
    lat: coords.lat,
    lng: coords.lng,
    status: d.status,
    publishedAt: d.status === "PUBLISHED" ? (content.publishedAt ?? new Date()) : content.publishedAt,
    expiresAt: date(d.expiresAt),
    featured: d.featured,
    keywords: { deleteMany: {}, create: keywordsCreate(parseKeywords(d.keywords)) },
  };
  const v = adminDetailValues(content.type, d);
  if (v.job) data.job = { upsert: { create: v.job, update: v.job } };
  if (v.event) data.event = { upsert: { create: v.event, update: v.event } };
  if (v.place) data.place = { upsert: { create: v.place, update: v.place } };
  if (v.classified) data.classified = { upsert: { create: v.classified, update: v.classified } };
  if (v.deal) data.deal = { upsert: { create: v.deal, update: v.deal } };

  await db.content.update({ where: { id: content.id }, data });

  await audit(user.id, "content.update", "Content", content.id, {
    title: d.title,
    type: content.type,
    status: d.status,
    ...(d.status !== content.status && { from: content.status }),
  });
  await indexContent(content.id).catch(() => {});
  revalidateContent(content.type, content.slug);
  revalidatePath(`/admin/contenus/${content.id}`);

  const geo = d.city && coords.lat === null ? " Géocodage impossible : indiquez les coordonnées à la main pour la carte." : "";
  return { ok: true, message: `Modifications enregistrées.${geo}` };
}

/* ---------- Mémoire : nouvelle personnalité (Béninois qui comptent) ---------- */

const celebritySchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(120, "Nom limité à 120 caractères"),
  domain: optText(60),
  bio: z.preprocess(vide, z.string().max(5000, "Biographie limitée à 5 000 caractères").optional()),
  photo: optUrl,
  link1Label: optText(60), link1Url: optUrl,
  link2Label: optText(60), link2Url: optUrl,
  link3Label: optText(60), link3Url: optUrl,
});

type CelebrityFields = z.infer<typeof celebritySchema>;

/* Liens (3 au plus) : seuls ceux qui ont une adresse sont conservés. */
function celebrityLinks(d: CelebrityFields) {
  return (
    [
      [d.link1Label, d.link1Url],
      [d.link2Label, d.link2Url],
      [d.link3Label, d.link3Url],
    ] as const
  )
    .filter(([, url]) => url)
    .map(([label, url]) => ({ label: label ?? "Site", url: url! }));
}

export async function createCelebrityAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const user = await requireStaff();
  if (!user) return REFUS;

  const parsed = celebritySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssueWithField(parsed.error);
  const d = parsed.data;
  const links = celebrityLinks(d);

  const root = slugify(d.name).slice(0, 80) || "personnalite";
  let slug = root;
  for (let i = 2; await db.celebrity.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${root}-${i}`;

  const created = await db.celebrity.create({
    data: { name: d.name, slug, domain: d.domain ?? null, bio: d.bio ?? null, photo: d.photo ?? null, links: links.length ? links : undefined },
    select: { id: true },
  });
  await audit(user.id, "celebrity.create", "Celebrity", created.id, { name: d.name, domain: d.domain ?? null });

  revalidatePath("/admin/memoire");
  revalidatePath("/magazine/beninois-qui-comptent");
  return { ok: true, message: `Fiche « ${d.name} » créée.` };
}

/* ---------- Mémoire : modifier une personnalité (adresse/slug inchangée) ---------- */

const updateCelebritySchema = celebritySchema.extend({ id: z.string().trim().min(1).max(64) });

export async function updateCelebrityAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const user = await requireStaff();
  if (!user) return REFUS;

  const parsed = updateCelebritySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssueWithField(parsed.error);
  const d = parsed.data;

  const existing = await db.celebrity.findUnique({ where: { id: d.id }, select: { id: true, name: true, domain: true } });
  if (!existing) return { error: "Fiche introuvable." };
  const links = celebrityLinks(d);

  await db.celebrity.update({
    where: { id: existing.id },
    data: { name: d.name, domain: d.domain ?? null, bio: d.bio ?? null, photo: d.photo ?? null, links: links.length ? links : Prisma.DbNull },
  });
  await audit(user.id, "celebrity.update", "Celebrity", existing.id, {
    name: d.name,
    domain: d.domain ?? null,
    ...(existing.name !== d.name && { from: existing.name }),
  });

  revalidatePath("/admin/memoire");
  revalidatePath(`/admin/memoire/personnalites/${existing.id}`);
  revalidatePath("/magazine/beninois-qui-comptent");
  return { ok: true, message: "Modifications enregistrées." };
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

/* ---------- Équipe : attribution des rôles (administrateur uniquement) ---------- */

const ROLES = ["USER", "EDITOR", "MODERATOR", "REGIE", "ADMIN"] as const;
type RoleCode = (typeof ROLES)[number];
const roleField = z.enum(ROLES, { error: "Rôle invalide" });

const REFUS_ADMIN = { error: "Seul un administrateur peut attribuer les rôles." } as const;

const ROLE_LABEL_ACTION: Record<RoleCode, string> = {
  USER: "Membre",
  EDITOR: "Rédaction",
  MODERATOR: "Modération",
  REGIE: "Régie publicitaire",
  ADMIN: "Administrateur",
};

/* Cœur partagé : garde-fous (son propre rôle ADMIN, dernier ADMIN), écriture, audit. */
async function applyRole(
  actor: { id: string },
  target: { id: string; email: string; role: RoleCode; status: string },
  role: RoleCode,
): Promise<AdminActionState> {
  if (target.status === "DELETED") return { error: "Ce compte a été supprimé." };
  if (target.role === role) return { error: "Ce compte a déjà ce rôle." };
  if (target.id === actor.id && role !== "ADMIN") return { error: "Impossible de retirer votre propre rôle d'administrateur." };
  if (target.role === "ADMIN" && role !== "ADMIN") {
    const admins = await db.user.count({ where: { role: "ADMIN", status: { not: "DELETED" } } });
    if (admins <= 1) return { error: "Impossible de rétrograder le dernier administrateur." };
  }

  await db.user.update({ where: { id: target.id }, data: { role } });
  await audit(actor.id, "user.role", "User", target.id, { email: target.email, from: target.role, to: role });

  revalidatePath("/admin");
  revalidatePath("/admin/parametres");
  revalidatePath("/admin/communaute");
  return { ok: true, message: `Rôle « ${ROLE_LABEL_ACTION[role]} » appliqué. Il prend effet à la prochaine connexion de la personne.` };
}

const userRoleSchema = z.object({ id: z.string().min(1), role: roleField });

export async function setUserRoleAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireStaff();
  if (!user) return REFUS;
  if (user.role !== "ADMIN") return REFUS_ADMIN;

  const parsed = userRoleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { id, role } = parsed.data;

  const target = await db.user.findUnique({ where: { id }, select: { id: true, email: true, role: true, status: true } });
  if (!target) return { error: "Compte introuvable." };
  return applyRole(user, target, role);
}

/* Ajouter à l'équipe : par e-mail d'un compte ACTIVE existant, avec un rôle d'équipe. */
const addTeamSchema = z.object({
  email: z.email("Adresse e-mail invalide").trim().toLowerCase().max(200),
  role: z.enum(["ADMIN"], { error: "Rôle invalide" }),
});

export async function addTeamMemberAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireStaff();
  if (!user) return REFUS;
  if (user.role !== "ADMIN") return REFUS_ADMIN;

  const parsed = addTeamSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { email, role } = parsed.data;

  const target = await db.user.findUnique({ where: { email }, select: { id: true, email: true, role: true, status: true } });
  if (!target) return { error: "Aucun compte avec cette adresse. La personne doit d'abord s'inscrire sur le site." };
  if (target.status !== "ACTIVE") return { error: "Ce compte n'est pas actif (e-mail à confirmer ou compte suspendu)." };
  if (target.role !== "USER") return { error: `Ce compte fait déjà partie de l'équipe (${ROLE_LABEL_ACTION[target.role]}) : modifiez son rôle dans la liste.` };
  return applyRole(user, target, role);
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

/* ---------- Réglages du site (réseaux sociaux…) : ADMIN seul, sans redéploiement ---------- */

const settingsSchema = z.object({
  ...Object.fromEntries(SOCIAL_NETWORKS.map((n) => [n.key, z.preprocess(vide, z.string().trim().url(`${n.label} : adresse invalide (https://…)`).max(300).optional())])),
  ...Object.fromEntries(
    NUMBER_SETTINGS.map((n) => [
      n.key,
      z.preprocess(vide, z.coerce.number({ error: `${n.label} : nombre attendu` }).int().min(n.min, `${n.label} : minimum ${n.min}`).max(n.max, `${n.label} : maximum ${n.max}`).transform(String).optional()),
    ]),
  ),
});

export async function saveSettingsAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireStaff();
  if (!user) return REFUS;
  if (user.role !== "ADMIN") return { error: "Seul un administrateur peut modifier les réglages." };
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const entries = Object.entries(parsed.data) as [string, string | undefined][];
  await db.$transaction(
    entries.map(([key, value]) =>
      value
        ? db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
        : db.siteSetting.deleteMany({ where: { key } }),
    ),
  );
  await audit(user.id, "settings.update", "SiteSetting", null, { keys: entries.filter(([, v]) => v).map(([k]) => k) });
  revalidatePath("/", "layout");
  revalidatePath("/admin/parametres");
  return { ok: true, message: "Réglages enregistrés : visibles immédiatement sur le site." };
}

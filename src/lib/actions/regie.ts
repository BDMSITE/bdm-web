"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { put } from "@vercel/blob";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SLOTS } from "@/lib/pub-slots";

/* Régie publicitaire : création, modification, mise en ligne, archivage des
   campagnes. Accès : rôle Régie ou Admin. Visuels déposés dans le Blob
   (accès public : une publicité est faite pour être vue). Tout est tracé. */

const REGIE = new Set(["REGIE", "ADMIN"]);
export type RegieState = { ok?: boolean; error?: string; message?: string; champ?: string; id?: string };
const REFUS = { error: "Accès réservé à la régie publicitaire." } as const;

async function requireRegie() {
  const session = await auth();
  if (!session?.user?.id || !REGIE.has(session.user.role ?? "")) return null;
  return session.user;
}

const vide = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optText = (max: number) => z.preprocess(vide, z.string().trim().max(max).optional());
const optUrl = z.preprocess(vide, z.string().trim().url("Adresse web invalide").optional());
const hex = z.preprocess(vide, z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur au format #RRGGBB").optional());
const SLOT_CODES = SLOTS.map((s) => s.code) as [string, ...string[]];

const fields = z.object({
  title: z.string().trim().min(2, "Nom de campagne trop court").max(120),
  advertiser: z.string().trim().min(2, "Nom de l'annonceur trop court").max(120),
  slot: z.enum(SLOT_CODES, { error: "Emplacement invalide" }),
  kind: z.enum(["IMAGE", "CARD"]),
  link: z.string().trim().url("Lien invalide (https://…)"),
  alt: z.string().trim().min(3, "Texte alternatif obligatoire (accessibilité)").max(200),
  headline: optText(80),
  tagline: optText(160),
  cta: optText(30),
  bg: hex,
  fg: hex,
  image: optUrl,
  imageMobile: optUrl,
  photo: optUrl,
  startsAt: z.string().min(1, "Date de début obligatoire"),
  endsAt: z.preprocess(vide, z.string().optional()),
  weight: z.coerce.number().int().min(1).max(10),
  sections: optText(300),
  countries: optText(300),
  house: z.preprocess((v) => v === "on", z.boolean()),
  status: z.enum(["DRAFT", "IN_MODERATION", "PUBLISHED", "REJECTED", "ARCHIVED"]),
});
type Fields = z.infer<typeof fields>;

function issue(e: z.ZodError): RegieState {
  const i = e.issues[0];
  return { error: i?.message ?? "Données invalides.", champ: i ? String(i.path[0] ?? "") : undefined };
}

const liste = (s?: string) => (s ? [...new Set(s.split(/[,;]/).map((x) => x.trim().toLowerCase().replace(/^\//, "")).filter(Boolean))] : []);

async function uploadVisual(file: FormDataEntryValue | null, prefix: string): Promise<string | { error: string } | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { error: "Dépôt de fichier non activé : indiquez l'adresse d'une image en ligne." };
  if (!/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(file.type)) return { error: "Visuel : PNG, JPG, WebP, GIF ou SVG." };
  if (file.size > 1.5 * 1024 * 1024) return { error: "Visuel trop lourd (1,5 Mo max.)." };
  const ext = file.type === "image/svg+xml" ? "svg" : file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const r = await put(`pub/${prefix}-${Date.now()}.${ext}`, file, { access: "public", contentType: file.type, addRandomSuffix: true });
  return r.url;
}

type Built = { ok: true; data: Prisma.BannerUncheckedCreateInput } | { ok: false; state: RegieState };

async function buildData(d: Fields, formData: FormData, id: string | undefined): Promise<Built> {
  const up = await uploadVisual(formData.get("imageFile"), `${d.slot.toLowerCase()}-${id ?? "new"}`);
  if (up && typeof up === "object") return { ok: false, state: up };
  const upM = await uploadVisual(formData.get("imageMobileFile"), `${d.slot.toLowerCase()}-m-${id ?? "new"}`);
  if (upM && typeof upM === "object") return { ok: false, state: upM };
  const upP = await uploadVisual(formData.get("photoFile"), `${d.slot.toLowerCase()}-photo-${id ?? "new"}`);
  if (upP && typeof upP === "object") return { ok: false, state: upP };
  const image = up ?? d.image ?? null;
  if (d.kind === "IMAGE" && !image) return { ok: false, state: { error: "Un visuel est obligatoire pour une campagne « image ».", champ: "image" } };
  const startsAt = new Date(d.startsAt);
  const endsAt = d.endsAt ? new Date(d.endsAt) : null;
  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) return { ok: false, state: { error: "Date invalide." } };
  if (endsAt && endsAt < startsAt) return { ok: false, state: { error: "La fin doit suivre le début.", champ: "endsAt" } };
  return { ok: true, data: {
    title: d.title, advertiser: d.advertiser, slot: d.slot as Prisma.BannerUncheckedCreateInput["slot"], kind: d.kind, link: d.link, alt: d.alt,
    headline: d.headline ?? null, tagline: d.tagline ?? null, cta: d.cta ?? null, bg: d.bg ?? null, fg: d.fg ?? null,
    image, imageMobile: upM ?? d.imageMobile ?? null, photo: upP ?? d.photo ?? null,
    startsAt, endsAt, weight: d.weight, sections: liste(d.sections), countries: liste(d.countries), house: d.house, status: d.status,
  } };
}

function refresh(id?: string) {
  revalidatePath("/admin/regie");
  if (id) revalidatePath(`/admin/regie/${id}`);
  revalidatePath("/", "layout");
}

export async function createBannerAction(_prev: RegieState, formData: FormData): Promise<RegieState> {
  const user = await requireRegie();
  if (!user) return REFUS;
  const parsed = fields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return issue(parsed.error);
  const built = await buildData(parsed.data, formData, undefined);
  if (!built.ok) return built.state;
  const data = built.data;
  const created = await db.banner.create({ data: { ...data, createdById: user.id }, select: { id: true } });
  await db.auditLog.create({ data: { userId: user.id, action: "banner.create", entity: "Banner", entityId: created.id, meta: { title: data.title, slot: data.slot, status: data.status } } });
  refresh(created.id);
  return { ok: true, id: created.id, message: data.status === "PUBLISHED" ? "Campagne créée et en diffusion." : "Campagne enregistrée." };
}

export async function updateBannerAction(_prev: RegieState, formData: FormData): Promise<RegieState> {
  const user = await requireRegie();
  if (!user) return REFUS;
  const id = String(formData.get("id") ?? "");
  const existing = await db.banner.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!existing) return { error: "Campagne introuvable." };
  const parsed = fields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return issue(parsed.error);
  const built = await buildData(parsed.data, formData, id);
  if (!built.ok) return built.state;
  const data = built.data;
  await db.banner.update({ where: { id }, data });
  await db.auditLog.create({ data: { userId: user.id, action: "banner.update", entity: "Banner", entityId: id, meta: { title: data.title, status: data.status, ...(data.status !== existing.status && { from: existing.status }) } } });
  refresh(id);
  return { ok: true, id, message: "Modifications enregistrées." };
}

const statusSchema = z.object({ id: z.string().min(1), status: z.enum(["PUBLISHED", "ARCHIVED", "REJECTED", "DRAFT"]) });

export async function setBannerStatusAction(_prev: RegieState, formData: FormData): Promise<RegieState> {
  const user = await requireRegie();
  if (!user) return REFUS;
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Données invalides." };
  const b = await db.banner.findUnique({ where: { id: parsed.data.id }, select: { status: true, title: true } });
  if (!b) return { error: "Campagne introuvable." };
  await db.banner.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  await db.auditLog.create({ data: { userId: user.id, action: "banner.status", entity: "Banner", entityId: parsed.data.id, meta: { title: b.title, from: b.status, to: parsed.data.status } } });
  refresh(parsed.data.id);
  const LIB: Record<string, string> = { PUBLISHED: "Campagne en diffusion.", ARCHIVED: "Campagne archivée.", REJECTED: "Campagne refusée.", DRAFT: "Campagne repassée en brouillon." };
  return { ok: true, message: LIB[parsed.data.status] };
}

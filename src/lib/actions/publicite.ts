"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SLOTS } from "@/lib/pub-slots";
import { sendBannerSubmitted } from "@/lib/mail";
import { rateLimit } from "@/lib/ratelimit";

/* Libre-service annonceur : un membre connecté dépose une campagne depuis son
   espace. Elle part en validation (IN_MODERATION) ; la régie fixe le tarif,
   valide ou refuse. Le membre ne choisit ni le statut, ni le poids, ni le
   caractère « maison ». Il peut modifier (→ revalidation) ou retirer. */

export type PubState = { ok?: boolean; error?: string; champ?: string; id?: string };
const BASE_URL = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const vide = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optText = (max: number) => z.preprocess(vide, z.string().trim().max(max).optional());
const optUrl = z.preprocess(vide, z.string().trim().url("Adresse web invalide (https://…)").optional());
const hex = z.preprocess(vide, z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur au format #RRGGBB").optional());

const schema = z.object({
  title: z.string().trim().min(2, "Donnez un nom à votre campagne").max(120),
  slot: z.enum(SLOTS.map((s) => s.code) as [string, ...string[]], { error: "Choisissez un emplacement" }),
  kind: z.enum(["IMAGE", "CARD"]),
  link: z.string().trim().url("Lien de destination invalide (https://…)"),
  alt: z.string().trim().min(3, "Décrivez votre publicité en une phrase (accessibilité)").max(200),
  headline: optText(80),
  tagline: optText(160),
  bg: hex,
  fg: hex,
  image: optUrl,
  photo: optUrl,
  startsAt: z.string().min(1, "Indiquez la date de début souhaitée"),
  endsAt: z.preprocess(vide, z.string().optional()),
});

async function me() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const profile = await db.profile.findUnique({ where: { userId: session.user.id }, select: { id: true, displayName: true, user: { select: { email: true, status: true } } } });
  if (!profile || profile.user.status !== "ACTIVE") return null;
  return { userId: session.user.id, ...profile };
}

async function upload(file: FormDataEntryValue | null, prefix: string): Promise<string | { error: string } | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { error: "Dépôt de fichier non activé : indiquez l'adresse d'une image en ligne." };
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return { error: "Image : PNG, JPG, WebP ou GIF." };
  if (file.size > 1.5 * 1024 * 1024) return { error: "Image trop lourde (1,5 Mo max.)." };
  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const r = await put(`pub/membres/${prefix}-${Date.now()}.${ext}`, file, { access: "public", contentType: file.type, addRandomSuffix: true });
  return r.url;
}

function issue(e: z.ZodError): PubState {
  const i = e.issues[0];
  return { error: i?.message ?? "Données invalides.", champ: i ? String(i.path[0] ?? "") : undefined };
}

async function build(formData: FormData, profileId: string, existingId?: string) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false as const, state: issue(parsed.error) };
  const d = parsed.data;
  const up = await upload(formData.get("imageFile"), `${profileId}-${d.slot.toLowerCase()}`);
  if (up && typeof up === "object") return { ok: false as const, state: up };
  const upP = await upload(formData.get("photoFile"), `${profileId}-photo`);
  if (upP && typeof upP === "object") return { ok: false as const, state: upP };
  const image = up ?? d.image ?? null;
  if (d.kind === "IMAGE" && !image) return { ok: false as const, state: { error: "Ajoutez votre visuel (fichier ou adresse).", champ: "image" } };
  const startsAt = new Date(d.startsAt);
  const endsAt = d.endsAt ? new Date(d.endsAt) : null;
  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) return { ok: false as const, state: { error: "Date invalide." } };
  if (endsAt && endsAt < startsAt) return { ok: false as const, state: { error: "La fin doit suivre le début.", champ: "endsAt" } };
  void existingId;
  return {
    ok: true as const,
    data: {
      title: d.title, slot: d.slot as "TOP" | "SIDE" | "MID" | "BOTTOM", kind: d.kind, link: d.link, alt: d.alt,
      headline: d.headline ?? null, tagline: d.tagline ?? null, bg: d.bg ?? null, fg: d.fg ?? null,
      image, photo: upP ?? d.photo ?? null, startsAt, endsAt, status: "IN_MODERATION" as const,
    },
  };
}

function refresh(id?: string) {
  revalidatePath("/compte/publicite");
  revalidatePath("/admin/regie");
  if (id) revalidatePath(`/compte/publicite/${id}`);
}

export async function createMyBannerAction(_prev: PubState, formData: FormData): Promise<PubState> {
  const p = await me();
  if (!p) return { error: "Connectez-vous avec un compte activé pour déposer une campagne." };
  if (!(await rateLimit(`pub:${p.userId}`, 5, 3600))) return { error: "Trop de dépôts en une heure : réessayez plus tard." };
  const built = await build(formData, p.id);
  if (!built.ok) return built.state;
  const created = await db.banner.create({
    data: { ...built.data, advertiser: p.displayName, profileId: p.id, createdById: p.userId, house: false, weight: 1 },
    select: { id: true },
  });
  await db.auditLog.create({ data: { userId: p.userId, action: "banner.submit", entity: "Banner", entityId: created.id, meta: { title: built.data.title, slot: built.data.slot } } });
  await sendBannerSubmitted(built.data.title, p.displayName, `${BASE_URL}/admin/regie/${created.id}`).catch(() => {});
  refresh(created.id);
  return { ok: true, id: created.id };
}

export async function updateMyBannerAction(_prev: PubState, formData: FormData): Promise<PubState> {
  const p = await me();
  if (!p) return { error: "Connectez-vous pour modifier votre campagne." };
  const id = String(formData.get("id") ?? "");
  const b = await db.banner.findFirst({ where: { id, profileId: p.id }, select: { id: true, status: true, title: true } });
  if (!b) return { error: "Campagne introuvable." };
  const built = await build(formData, p.id, id);
  if (!built.ok) return built.state;
  await db.banner.update({ where: { id }, data: built.data });
  await db.auditLog.create({ data: { userId: p.userId, action: "banner.submit", entity: "Banner", entityId: id, meta: { title: built.data.title, from: b.status } } });
  if (b.status !== "DRAFT") await sendBannerSubmitted(built.data.title, p.displayName, `${BASE_URL}/admin/regie/${id}`).catch(() => {});
  refresh(id);
  return { ok: true, id };
}

export async function withdrawMyBannerAction(formData: FormData) {
  const p = await me();
  if (!p) return;
  const id = String(formData.get("id") ?? "");
  const b = await db.banner.findFirst({ where: { id, profileId: p.id }, select: { id: true, title: true, status: true } });
  if (!b) return;
  await db.banner.update({ where: { id }, data: { status: "ARCHIVED" } });
  await db.auditLog.create({ data: { userId: p.userId, action: "banner.withdraw", entity: "Banner", entityId: id, meta: { title: b.title, from: b.status } } });
  refresh(id);
}

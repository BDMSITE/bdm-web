"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeCountry, normalizeCity } from "@/lib/pays";
import { indexContent } from "@/lib/search";
import { SECTION, contentHref } from "@/lib/routes";
import { publishFields, refinePublish, parseKeywords, keywordsCreate, detailValues } from "@/lib/publier-schema";

/* Espace membre — mes publications : modifier, retirer, republier.
   Chaque action exige une session et ne touche qu'aux contenus dont le
   profil de l'utilisateur connecté est propriétaire. */

export type PublicationState = { error?: string; champ?: string; ok?: boolean; message?: string };

const idSchema = z.object({ id: z.string().trim().min(1).max(64) });

async function requireUserId() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte/publications");
  return session.user.id;
}

/* Le contenu n'est chargé que s'il appartient au membre connecté. */
async function ownedContent(id: string, userId: string) {
  return db.content.findFirst({
    where: { id, ownerProfile: { userId } },
    select: { id: true, type: true, slug: true, status: true, publishedAt: true },
  });
}

async function afterChange(content: { id: string; type: Parameters<typeof contentHref>[0]; slug: string }) {
  await indexContent(content.id).catch(() => {});
  revalidatePath("/compte");
  revalidatePath("/compte/publications");
  revalidatePath(`/compte/publications/${content.id}`);
  revalidatePath("/compte/favoris");
  revalidatePath(SECTION[content.type]);
  revalidatePath(contentHref(content.type, content.slug));
}

/* --- Modifier --------------------------------------------------------- */

export async function updateContentAction(_prev: PublicationState, formData: FormData): Promise<PublicationState> {
  const userId = await requireUserId();

  const idParsed = idSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) return { error: "Contenu introuvable." };

  const content = await ownedContent(idParsed.data.id, userId);
  if (!content) return { error: "Contenu introuvable." };

  const schema = publishFields.superRefine((d, ctx) => refinePublish(content.type, d, ctx));
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, champ: String(issue.path[0] ?? "") };
  }
  const d = parsed.data;

  // Un contenu déjà relu (en ligne ou refusé) repasse en modération ; sinon le statut ne bouge pas.
  const backToModeration = content.status === "PUBLISHED" || content.status === "REJECTED";

  const data: Prisma.ContentUpdateInput = {
    title: d.title,
    excerpt: d.excerpt || null,
    body: d.body,
    country: normalizeCountry(d.country),
    city: normalizeCity(d.city),
    ...(backToModeration && { status: "IN_MODERATION" }),
    keywords: { deleteMany: {}, create: keywordsCreate(parseKeywords(d.keywords)) },
  };

  const v = detailValues(content.type, d);
  if (v.job) data.job = { upsert: { create: { ...v.job, applyMode: "form" }, update: v.job } };
  if (v.event) data.event = { upsert: { create: v.event, update: v.event } };
  if (v.place) data.place = { upsert: { create: v.place, update: v.place } };
  if (v.classified) data.classified = { upsert: { create: v.classified, update: v.classified } };

  await db.content.update({ where: { id: content.id }, data });
  await afterChange(content);

  const inModeration = backToModeration || content.status === "IN_MODERATION";
  return { ok: true, message: inModeration ? "Modifications envoyées, relues par la modération." : "Modifications enregistrées." };
}

/* --- Retirer de la ligne (archiver) ------------------------------------ */

export async function withdrawContentAction(_prev: PublicationState, formData: FormData): Promise<PublicationState> {
  const userId = await requireUserId();

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Contenu introuvable." };

  const content = await ownedContent(parsed.data.id, userId);
  if (!content) return { error: "Contenu introuvable." };
  if (content.status === "ARCHIVED") return { error: "Ce contenu est déjà retiré." };

  await db.content.update({ where: { id: content.id }, data: { status: "ARCHIVED" } });
  await afterChange(content);
  return { ok: true, message: "Contenu retiré de la ligne." };
}

/* --- Republier (archivé → modération) ---------------------------------- */

export async function republishContentAction(_prev: PublicationState, formData: FormData): Promise<PublicationState> {
  const userId = await requireUserId();

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Contenu introuvable." };

  const content = await ownedContent(parsed.data.id, userId);
  if (!content) return { error: "Contenu introuvable." };
  if (content.status !== "ARCHIVED") return { error: "Seul un contenu retiré peut être republié." };

  await db.content.update({ where: { id: content.id }, data: { status: "IN_MODERATION" } });
  await afterChange(content);
  return { ok: true, message: "Demande envoyée : le contenu sera relu par la modération avant remise en ligne." };
}

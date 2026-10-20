"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/* Favoris : un membre connecté met un contenu de côté (ou le retire).
   N'écrit que sur les lignes Favorite de l'utilisateur connecté. */

export type FavoriteResult = { favorite: boolean; error?: string };

const idSchema = z.string().trim().min(1).max(64);

export async function toggleFavoriteAction(contentId: string): Promise<FavoriteResult> {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const parsed = idSchema.safeParse(contentId);
  if (!parsed.success) return { favorite: false, error: "Contenu introuvable." };
  const id = parsed.data;
  const key = { userId_contentId: { userId: session.user.id, contentId: id } };

  const existing = await db.favorite.findUnique({ where: key, select: { contentId: true } });
  let favorite: boolean;
  if (existing) {
    await db.favorite.delete({ where: key });
    favorite = false;
  } else {
    const content = await db.content.findUnique({ where: { id }, select: { id: true } });
    if (!content) return { favorite: false, error: "Contenu introuvable." };
    await db.favorite.create({ data: { userId: session.user.id, contentId: id } });
    favorite = true;
  }

  revalidatePath("/compte/favoris");
  return { favorite };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

/* Signalement d'un contenu par un membre connecté : file « Signalements » de la modération. */

export type ReportState = { ok?: boolean; error?: string };

const schema = z.object({
  contentId: z.string().min(1),
  reason: z.string().trim().min(10, "Expliquez en quelques mots (10 caractères minimum).").max(800, "Signalement limité à 800 caractères."),
});

export async function reportContentAction(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const session = await auth();
  if (!session?.user) return { error: "Connectez-vous pour signaler un contenu." };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await rateLimit(`report:${session.user.id}`, 5, 3600))) return { error: "Vous avez déjà envoyé plusieurs signalements : réessayez dans une heure." };
  const content = await db.content.findUnique({ where: { id: parsed.data.contentId }, select: { id: true } });
  if (!content) return { error: "Contenu introuvable." };
  const existing = await db.report.findFirst({ where: { contentId: content.id, reporterId: session.user.id, status: "open" }, select: { id: true } });
  if (existing) return { error: "Vous avez déjà signalé ce contenu : la modération le traite." };
  await db.report.create({ data: { contentId: content.id, reporterId: session.user.id, reason: parsed.data.reason } });
  revalidatePath("/admin/moderation");
  return { ok: true };
}

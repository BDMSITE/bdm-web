"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentHref } from "@/lib/routes";

/* « J'y vais » sur un événement : le membre s'inscrit ou se désinscrit. L'organisateur
   voit la liste des participants ; un rappel part la veille. */

export type RsvpState = { ok?: boolean; going?: boolean; count?: number; error?: string };

export async function toggleRsvpAction(_prev: RsvpState, formData: FormData): Promise<RsvpState> {
  const session = await auth();
  const contentId = String(formData.get("contentId") ?? "");
  if (!session?.user) redirect(`/connexion?callbackUrl=${encodeURIComponent(String(formData.get("retour") ?? "/agenda"))}`);
  const event = await db.content.findFirst({ where: { id: contentId, type: "EVENT", status: "PUBLISHED" }, select: { id: true, slug: true, event: { select: { startsAt: true } } } });
  if (!event) return { error: "Événement introuvable." };
  if (event.event && event.event.startsAt < new Date()) return { error: "Cet événement est passé." };
  const key = { contentId_userId: { contentId: event.id, userId: session.user.id } };
  const existing = await db.eventRsvp.findUnique({ where: key });
  if (existing) await db.eventRsvp.delete({ where: key });
  else await db.eventRsvp.create({ data: { contentId: event.id, userId: session.user.id } });
  const count = await db.eventRsvp.count({ where: { contentId: event.id } });
  revalidatePath(contentHref("EVENT", event.slug));
  return { ok: true, going: !existing, count };
}

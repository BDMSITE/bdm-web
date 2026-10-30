"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendRelayNotification } from "@/lib/mail";
import { contentHref } from "@/lib/routes";
import { SITE_URL as BASE_URL } from "@/lib/site-url";

/* Messagerie relais : jamais d'e-mail exposé. Un message vise un profil
   (fiche membre) ou l'auteur d'un contenu ; la réponse se fait sur le site.
   Candidature : enregistrement + notification au recruteur. */

const MAX_PAR_HEURE = 20;

export type RelayState = { ok?: boolean; error?: string };

const messageSchema = z.object({
  body: z.string().trim().min(10, "Message trop court (10 caractères minimum)").max(3000, "Message limité à 3 000 caractères"),
  toProfileId: z.string().optional(),
  contentId: z.string().optional(),
  parentId: z.string().optional(),
});

async function quota(userId: string) {
  const n = await db.message.count({ where: { fromUserId: userId, createdAt: { gt: new Date(Date.now() - 36e5) } } });
  return n < MAX_PAR_HEURE;
}

export async function sendMessageAction(_prev: RelayState, formData: FormData): Promise<RelayState> {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (!(await quota(session.user.id))) return { error: "Vous avez envoyé beaucoup de messages : réessayez dans une heure." };

  let toProfileId = d.toProfileId ?? null;
  let contentId = d.contentId ?? null;
  if (d.parentId) {
    const parent = await db.message.findUnique({ where: { id: d.parentId }, include: { from: { include: { profile: { select: { id: true } } } }, to: { select: { userId: true } } } });
    if (!parent) return { error: "Conversation introuvable." };
    const isRecipient = parent.to.userId === session.user.id;
    const isSender = parent.fromUserId === session.user.id;
    if (!isRecipient && !isSender) return { error: "Conversation introuvable." };
    toProfileId = isRecipient ? parent.from.profile?.id ?? null : parent.toProfileId;
    contentId = parent.contentId;
    if (!toProfileId) return { error: "Ce membre n'a plus de profil." };
  } else if (contentId) {
    const c = await db.content.findUnique({ where: { id: contentId, status: "PUBLISHED" }, select: { ownerProfileId: true } });
    if (!c?.ownerProfileId) return { error: "Ce contenu n'a pas d'auteur joignable." };
    toProfileId = c.ownerProfileId;
  }
  if (!toProfileId) return { error: "Destinataire manquant." };

  const to = await db.profile.findUnique({ where: { id: toProfileId }, include: { user: { select: { id: true, email: true, status: true } } } });
  if (!to || to.user.status !== "ACTIVE") return { error: "Ce membre ne peut pas être contacté." };
  if (to.user.id === session.user.id) return { error: "Vous ne pouvez pas vous écrire à vous-même." };

  const fromProfile = await db.profile.findUnique({ where: { userId: session.user.id }, select: { displayName: true } });
  const content = contentId ? await db.content.findUnique({ where: { id: contentId }, select: { title: true } }) : null;

  await db.message.create({
    data: { fromUserId: session.user.id, toProfileId, toUserId: to.user.id, contentId, parentId: d.parentId ?? null, body: d.body },
  });

  const fromName = fromProfile?.displayName ?? "Un membre";
  const subject = content ? `Message au sujet de « ${content.title} »` : `Nouveau message de ${fromName}`;
  await sendRelayNotification(to.user.email, fromName, subject, d.body, `${BASE_URL}/compte/messages`).catch(() => {});

  revalidatePath("/compte/messages");
  return { ok: true };
}

const applySchema = z.object({
  contentId: z.string(),
  message: z.string().trim().min(20, "Présentez-vous en quelques lignes (20 caractères minimum)").max(3000),
  cvUrl: z.union([z.literal(""), z.url("Lien du CV invalide")]),
});

export async function applyAction(_prev: RelayState, formData: FormData): Promise<RelayState> {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const parsed = applySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const offre = await db.content.findUnique({
    where: { id: d.contentId, status: "PUBLISHED", type: { in: ["JOB", "INTERNSHIP"] } },
    include: { ownerProfile: { include: { user: { select: { id: true, email: true, status: true } } } } },
  });
  if (!offre) return { error: "Cette offre n'est plus disponible." };
  if (offre.ownerProfile?.user.id === session.user.id) return { error: "Vous êtes l'auteur de cette offre." };
  if (await db.application.findUnique({ where: { contentId_userId: { contentId: d.contentId, userId: session.user.id } } })) {
    return { error: "Vous avez déjà postulé à cette offre." };
  }

  const me = await db.profile.findUnique({ where: { userId: session.user.id }, select: { displayName: true, cvUrl: true } });
  const cvUrl = d.cvUrl || me?.cvUrl || null;
  await db.application.create({ data: { contentId: d.contentId, userId: session.user.id, message: d.message, cvUrl } });

  if (offre.ownerProfile?.user.status === "ACTIVE") {
    const texte = `${d.message}${cvUrl ? `\n\nCV : ${cvUrl.startsWith("/") ? BASE_URL + cvUrl : cvUrl}` : ""}`;
    await sendRelayNotification(offre.ownerProfile.user.email, me?.displayName ?? "Un membre", `Candidature : ${offre.title}`, texte, `${BASE_URL}/compte/candidatures-recues`).catch(() => {});
  }

  revalidatePath("/compte/candidatures");
  revalidatePath(contentHref(offre.type, offre.slug));
  return { ok: true };
}

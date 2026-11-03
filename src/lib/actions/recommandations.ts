"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { flag } from "@/lib/settings";
import { sendRecommendationNotice } from "@/lib/mail";
import { SITE_URL } from "@/lib/site-url";
import { contentHref, profileHref } from "@/lib/routes";

/* Recommandations : un membre connecté recommande un autre membre ou une bonne adresse
   (une seule par cible et par auteur, modifiable, supprimable). Relue par la modération
   sauf si le réglage « recommandations libres » est activé. */

export type RecoState = { ok?: boolean; error?: string; message?: string; status?: "PUBLISHED" | "IN_MODERATION" | null };

const schema = z.object({
  profileId: z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : undefined), z.string().max(64).optional()),
  contentId: z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : undefined), z.string().max(64).optional()),
  retour: z.string().max(300).optional(),
  text: z.string().trim().min(20, "Dites en quelques mots pourquoi vous recommandez (20 caractères minimum)").max(400, "Recommandation limitée à 400 caractères"),
});

export async function recommendAction(_prev: RecoState, formData: FormData): Promise<RecoState> {
  const session = await auth();
  if (!session?.user) redirect(`/connexion?callbackUrl=${encodeURIComponent(String(formData.get("retour") ?? "/communaute"))}`);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (!d.profileId === !d.contentId) return { error: "Cible introuvable." };

  const me = await db.user.findUnique({ where: { id: session.user.id }, select: { status: true, profile: { select: { id: true, displayName: true } } } });
  if (!me || me.status !== "ACTIVE" || !me.profile) return { error: "Votre compte doit être actif pour recommander." };

  let target: { profileHref?: string; contentHref?: string; email?: string; prenom?: string; emailOk?: boolean } = {};
  if (d.profileId) {
    if (d.profileId === me.profile.id) return { error: "On ne se recommande pas soi-même." };
    const p = await db.profile.findFirst({ where: { id: d.profileId, user: { status: "ACTIVE" } }, select: { slug: true, displayName: true, user: { select: { email: true } } } });
    if (!p) return { error: "Membre introuvable." };
    target = { profileHref: profileHref(p.slug), email: p.user.email, prenom: p.displayName.split(" ")[0], emailOk: true };
  } else {
    const c = await db.content.findFirst({ where: { id: d.contentId!, type: "PLACE", status: "PUBLISHED" }, select: { slug: true, type: true, ownerProfileId: true } });
    if (!c) return { error: "Adresse introuvable." };
    if (c.ownerProfileId === me.profile.id) return { error: "Vous ne pouvez pas recommander votre propre adresse." };
    target = { contentHref: contentHref(c.type, c.slug) };
  }

  const libres = await flag("communaute.recommandations_libres");
  const status = libres ? "PUBLISHED" : "IN_MODERATION";
  const where = d.profileId ? { authorId_profileId: { authorId: session.user.id, profileId: d.profileId } } : { authorId_contentId: { authorId: session.user.id, contentId: d.contentId! } };
  const existing = await db.recommendation.findUnique({ where, select: { id: true, status: true } });
  const reco = existing
    ? await db.recommendation.update({ where: { id: existing.id }, data: { text: d.text, status } })
    : await db.recommendation.create({ data: { authorId: session.user.id, profileId: d.profileId ?? null, contentId: d.contentId ?? null, text: d.text, status } });

  if (status === "PUBLISHED" && target.emailOk && target.email && !existing) {
    await sendRecommendationNotice(target.email, { prenom: target.prenom ?? "", auteur: me.profile.displayName, text: reco.text, href: `${SITE_URL}${target.profileHref}` }).catch((e) => console.error("[recommandation] e-mail impossible", e));
  }
  if (target.profileHref) revalidatePath(target.profileHref);
  if (target.contentHref) revalidatePath(target.contentHref);
  revalidatePath("/communaute", "layout");
  revalidatePath("/admin/moderation");
  return {
    ok: true,
    status,
    message: status === "PUBLISHED" ? "Merci ! Votre recommandation est publiée." : "Merci ! Votre recommandation sera publiée après relecture par la modération.",
  };
}

export async function deleteRecommendationAction(_prev: RecoState, formData: FormData): Promise<RecoState> {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const id = String(formData.get("id") ?? "");
  const reco = await db.recommendation.findFirst({ where: { id, authorId: session.user.id }, include: { profile: { select: { slug: true } }, content: { select: { type: true, slug: true } } } });
  if (!reco) return { error: "Recommandation introuvable." };
  await db.recommendation.delete({ where: { id: reco.id } });
  if (reco.profile) revalidatePath(profileHref(reco.profile.slug));
  if (reco.content) revalidatePath(contentHref(reco.content.type, reco.content.slug));
  revalidatePath("/communaute", "layout");
  return { ok: true, status: null, message: "Recommandation retirée." };
}

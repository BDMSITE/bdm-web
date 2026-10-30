"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { numberSetting } from "@/lib/settings";
import { slugify } from "@/lib/slug";
import { PUBLISH_TYPES, publishFields, refinePublish, parseKeywords, keywordsCreate, detailValues } from "@/lib/publier-schema";

/* Guichet « Publier » : un membre connecté dépose un contenu, créé en statut
   IN_MODERATION et rattaché à son profil. Rien ne passe en ligne sans relecture.
   Les règles de validation sont partagées avec l'édition (src/lib/publier-schema.ts). */

const schema = publishFields
  .extend({ type: z.enum(PUBLISH_TYPES, { error: "Choisissez un type de contenu" }) })
  .superRefine((d, ctx) => refinePublish(d.type, d, ctx));

export type PublishState = { error?: string; champ?: string };

async function uniqueSlug(title: string) {
  const root = slugify(title).slice(0, 80) || "contenu";
  const taken = await db.content.findMany({ where: { slug: { startsWith: root } }, select: { slug: true } });
  if (taken.length === 0) return root;
  const slugs = new Set(taken.map((t) => t.slug));
  let n = 2;
  while (slugs.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

export async function publishAction(_prev: PublishState, formData: FormData): Promise<PublishState> {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/publier");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, champ: String(issue.path[0] ?? "") };
  }
  const d = parsed.data;

  const profile = await db.profile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!profile) return { error: "Votre profil est introuvable : complétez-le dans votre espace avant de publier." };

  /* Quota d'offres gratuites (réglable dans Paramètres) : offres en ligne ou en attente. */
  if (d.type === "JOB" || d.type === "INTERNSHIP") {
    const quota = await numberSetting("quota.offres");
    const enCours = await db.content.count({ where: { ownerProfileId: profile.id, type: { in: ["JOB", "INTERNSHIP"] }, status: { in: ["PUBLISHED", "IN_MODERATION"] } } });
    if (enCours >= quota) {
      return {
        error: `Vous avez déjà ${enCours} offre${enCours > 1 ? "s" : ""} en ligne ou en attente : le quota gratuit est de ${quota}. Archivez une offre terminée, ou écrivez au HCBE pour publier davantage.`,
        champ: "type",
      };
    }
  }

  const details: Prisma.ContentCreateInput = {
    type: d.type,
    title: d.title,
    slug: await uniqueSlug(d.title),
    excerpt: d.excerpt || null,
    body: d.body,
    country: d.country,
    city: d.city,
    status: "IN_MODERATION",
    ownerProfile: { connect: { id: profile.id } },
    keywords: { create: keywordsCreate(parseKeywords(d.keywords)) },
  };

  const v = detailValues(d.type, d);
  if (v.job) details.job = { create: { ...v.job, applyMode: "form" } };
  if (v.event) details.event = { create: v.event };
  if (v.place) details.place = { create: v.place };
  if (v.classified) details.classified = { create: v.classified };

  await db.content.create({ data: details });

  redirect("/compte/publications?envoye=1");
}

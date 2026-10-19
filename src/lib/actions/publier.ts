"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

/* Guichet « Publier » : un membre connecté dépose un contenu, créé en statut
   IN_MODERATION et rattaché à son profil. Rien ne passe en ligne sans relecture. */

// Un fichier « use server » n'exporte que des fonctions : la liste reste locale (dupliquée dans publier/form.tsx).
const PUBLISH_TYPES = ["MEMBER_ARTICLE", "JOB", "INTERNSHIP", "EVENT", "PLACE", "CLASSIFIED", "HELP_REQUEST"] as const;

const vide = (s: unknown) => (typeof s === "string" && s.trim() ? s.trim() : undefined);

const base = z.object({
  type: z.enum(PUBLISH_TYPES, { error: "Choisissez un type de contenu" }),
  title: z.string().trim().min(5, "Titre trop court (5 caractères minimum)").max(160, "Titre limité à 160 caractères"),
  excerpt: z.string().trim().max(300, "Chapô limité à 300 caractères"),
  body: z.string().trim().min(30, "Décrivez votre contenu (30 caractères minimum)").max(20000, "Texte trop long"),
  country: z.string().trim().min(1, "Pays obligatoire").max(80),
  city: z.string().trim().min(1, "Ville obligatoire").max(80),
  keywords: z.string().max(500),
  // champs selon le type (nettoyés : chaîne vide → absent)
  contractType: z.preprocess(vide, z.string().max(40).optional()),
  startsAt: z.preprocess(vide, z.string().optional()),
  venue: z.preprocess(vide, z.string().max(200).optional()),
  isOnline: z.string().optional(),
  category: z.preprocess(vide, z.string().max(60).optional()),
  address: z.preprocess(vide, z.string().max(200).optional()),
  price: z.preprocess(vide, z.string().max(60).optional()),
});

const schema = base.superRefine((d, ctx) => {
  if ((d.type === "JOB" || d.type === "INTERNSHIP") && !d.contractType) {
    ctx.addIssue({ code: "custom", path: ["contractType"], message: "Type de contrat obligatoire" });
  }
  if (d.type === "EVENT") {
    const date = d.startsAt ? new Date(d.startsAt) : null;
    if (!date || Number.isNaN(date.getTime())) ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Date et heure de l'événement obligatoires" });
    if (d.isOnline !== "on" && !d.venue) ctx.addIssue({ code: "custom", path: ["venue"], message: "Indiquez le lieu, ou cochez « en ligne »" });
  }
  if ((d.type === "PLACE" || d.type === "CLASSIFIED") && !d.category) {
    ctx.addIssue({ code: "custom", path: ["category"], message: "Catégorie obligatoire" });
  }
});

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

  const keywordNames = [...new Set(d.keywords.split(",").map((k) => k.trim()).filter(Boolean))].slice(0, 15);

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
  };

  if (d.type === "JOB" || d.type === "INTERNSHIP") {
    details.job = { create: { contractType: d.contractType!, applyMode: "form" } };
  } else if (d.type === "EVENT") {
    details.event = { create: { startsAt: new Date(d.startsAt!), isOnline: d.isOnline === "on", venue: d.isOnline === "on" ? null : d.venue, category: d.category ?? null } };
  } else if (d.type === "PLACE") {
    details.place = { create: { category: d.category!, address: d.address ?? null } };
  } else if (d.type === "CLASSIFIED") {
    details.classified = { create: { category: d.category!, price: d.price ?? null } };
  }

  await db.content.create({ data: details });

  redirect("/compte/publications?envoye=1");
}

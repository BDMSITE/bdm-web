import { z } from "zod";
import type { ContentType } from "@prisma/client";
import { slugify } from "@/lib/slug";

/* Validation commune au dépôt (/publier) et à l'édition (/compte/publications/[id])
   d'un contenu membre. Module sans « use server » : les actions l'importent. */

export const PUBLISH_TYPES = ["MEMBER_ARTICLE", "JOB", "INTERNSHIP", "EVENT", "PLACE", "CLASSIFIED", "HELP_REQUEST"] as const;
export type PublishType = (typeof PUBLISH_TYPES)[number];

const vide = (s: unknown) => (typeof s === "string" && s.trim() ? s.trim() : undefined);

/* Champs communs + champs selon le type (nettoyés : chaîne vide → absent). */
export const publishFields = z.object({
  title: z.string().trim().min(5, "Titre trop court (5 caractères minimum)").max(160, "Titre limité à 160 caractères"),
  excerpt: z.string().trim().max(300, "Chapô limité à 300 caractères"),
  body: z.string().trim().min(30, "Décrivez votre contenu (30 caractères minimum)").max(20000, "Texte trop long"),
  country: z.string().trim().min(1, "Pays obligatoire").max(80),
  city: z.string().trim().min(1, "Ville obligatoire").max(80),
  keywords: z.string().max(500),
  contractType: z.preprocess(vide, z.string().max(40).optional()),
  startsAt: z.preprocess(vide, z.string().optional()),
  venue: z.preprocess(vide, z.string().max(200).optional()),
  isOnline: z.string().optional(),
  category: z.preprocess(vide, z.string().max(60).optional()),
  address: z.preprocess(vide, z.string().max(200).optional()),
  price: z.preprocess(vide, z.string().max(60).optional()),
});

export type PublishFields = z.infer<typeof publishFields>;

/* Règles propres à chaque type (contrat, date, lieu, catégorie). */
export function refinePublish(type: ContentType, d: PublishFields, ctx: z.RefinementCtx) {
  if ((type === "JOB" || type === "INTERNSHIP") && !d.contractType) {
    ctx.addIssue({ code: "custom", path: ["contractType"], message: "Type de contrat obligatoire" });
  }
  if (type === "EVENT") {
    const date = d.startsAt ? new Date(d.startsAt) : null;
    if (!date || Number.isNaN(date.getTime())) ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Date et heure de l'événement obligatoires" });
    if (d.isOnline !== "on" && !d.venue) ctx.addIssue({ code: "custom", path: ["venue"], message: "Indiquez le lieu, ou cochez « en ligne »" });
  }
  if ((type === "PLACE" || type === "CLASSIFIED") && !d.category) {
    ctx.addIssue({ code: "custom", path: ["category"], message: "Catégorie obligatoire" });
  }
}

/* Mots-clés saisis « a, b, c » → noms uniques, 15 maximum. */
export function parseKeywords(s: string) {
  return [...new Set(s.split(",").map((k) => k.trim()).filter(Boolean))].slice(0, 15);
}

/* Clause Prisma `create` des mots-clés d'un contenu (famille THEME). */
export function keywordsCreate(names: string[]) {
  return names.map((name) => ({
    keyword: {
      connectOrCreate: {
        where: { slug: slugify(name) },
        create: { name, slug: slugify(name), family: "THEME" as const },
      },
    },
  }));
}

/* Valeurs des tables de détails selon le type (sans les champs techniques). */
export function detailValues(type: ContentType, d: PublishFields) {
  if (type === "JOB" || type === "INTERNSHIP") return { job: { contractType: d.contractType! } };
  if (type === "EVENT") {
    return { event: { startsAt: new Date(d.startsAt!), isOnline: d.isOnline === "on", venue: d.isOnline === "on" ? null : (d.venue ?? null), category: d.category ?? null } };
  }
  if (type === "PLACE") return { place: { category: d.category!, address: d.address ?? null } };
  if (type === "CLASSIFIED") return { classified: { category: d.category!, price: d.price ?? null } };
  return {};
}

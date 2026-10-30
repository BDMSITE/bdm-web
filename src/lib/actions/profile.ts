"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeCountry, normalizeCity } from "@/lib/pays";
import { slugify } from "@/lib/slug";
import { indexProfile } from "@/lib/search";
import { geocode } from "@/lib/geocode";
import { uploadPhoto, removePhotoBlob } from "@/lib/photo";

const schema = z.object({
  displayName: z.string().trim().min(2, "Nom affiché trop court").max(80),
  headline: z.string().trim().max(120, "Fonction limitée à 120 caractères"),
  removePhoto: z.string().optional(),
  companySize: z.string().trim().max(40).optional(),
  companySector: z.string().trim().max(80).optional(),
  assocPurpose: z.string().trim().max(400, "Objet limité à 400 caractères").optional(),
  assocFoundedYear: z.preprocess((v) => (typeof v === "string" && v.trim() ? Number(v) : undefined), z.number().int().min(1800).max(2100).optional()),
  assocMembersCount: z.preprocess((v) => (typeof v === "string" && v.trim() ? Number(v) : undefined), z.number().int().min(0).max(10000000).optional()),
  artistDiscipline: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80),
  country: z.string().trim().max(80),
  bio: z.string().trim().max(1500, "Bio limitée à 1 500 caractères"),
  website: z.union([z.literal(""), z.url("Adresse du site invalide")]),
  keywords: z.string().max(500),
  directory: z.string().optional(),
  kind: z.enum(["MEMBER", "COMPANY", "ASSOCIATION", "ARTIST"]).default("MEMBER"),
});

export type ProfileState = { error?: string; ok?: boolean };


export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte/profil");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const keywordNames = [...new Set(d.keywords.split(",").map((k) => k.trim()).filter(Boolean))].slice(0, 15);

  const avant = await db.profile.findUnique({ where: { userId: session.user.id }, select: { city: true, country: true, lat: true, photo: true } });
  if (!avant) return { error: "Votre profil est introuvable : contactez l'équipe du site." };
  const pid = (await db.profile.findUnique({ where: { userId: session.user.id }, select: { id: true } }))!.id;

  let photo: string | null | undefined;
  try {
    const nouvelle = await uploadPhoto(pid, formData.get("photo"));
    if (nouvelle) { photo = nouvelle; await removePhotoBlob(avant.photo); }
    else if (d.removePhoto === "on") { photo = null; await removePhotoBlob(avant.photo); }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Photo impossible à enregistrer." };
  }
  const lieuChange = !avant || avant.city !== (d.city || null) || avant.country !== (d.country || null) || avant.lat === null;
  const geo = lieuChange && d.city ? await geocode(d.city, d.country) : null;

  /* Ce que le membre représente : un attribut du compte, pas un compte à part.
     Les tables de détails (entreprise, association, artiste) sont créées à la demande. */
  await db.user.update({ where: { id: session.user.id }, data: { accountType: d.kind } });
  if (d.kind === "COMPANY") {
    const v = { size: d.companySize || null, sector: d.companySector || null };
    await db.companyDetails.upsert({ where: { profileId: pid }, update: v, create: { profileId: pid, ...v } });
  }
  if (d.kind === "ASSOCIATION") {
    const v = { purpose: d.assocPurpose || null, foundedYear: d.assocFoundedYear ?? null, membersCount: d.assocMembersCount ?? null };
    await db.associationDetails.upsert({ where: { profileId: pid }, update: v, create: { profileId: pid, ...v } });
  }
  if (d.kind === "ARTIST") {
    const v = { discipline: d.artistDiscipline || null };
    await db.artistDetails.upsert({ where: { profileId: pid }, update: v, create: { profileId: pid, ...v } });
  }

  const profile = await db.profile.update({
    where: { userId: session.user.id },
    data: {
      ...(lieuChange && { lat: geo?.lat ?? null, lng: geo?.lng ?? null }),
      displayName: d.displayName,
      headline: d.headline || null,
      ...(photo !== undefined && { photo }),
      city: normalizeCity(d.city) || null,
      country: normalizeCountry(d.country) || null,
      bio: d.bio || null,
      website: d.website || null,
      visibility: { directory: d.directory === "on" },
      keywords: {
        deleteMany: {},
        create: keywordNames.map((name) => ({
          keyword: {
            connectOrCreate: {
              where: { slug: slugify(name) },
              create: { name, slug: slugify(name), family: "THEME" },
            },
          },
        })),
      },
    },
    select: { id: true, slug: true },
  });

  await indexProfile(profile.id).catch(() => {});
  revalidatePath("/compte");
  revalidatePath("/compte/profil");
  revalidatePath(`/communaute/membres/${profile.slug}`);
  revalidatePath("/communaute", "layout");
  return { ok: true };
}

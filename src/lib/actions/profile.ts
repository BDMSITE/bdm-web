"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { indexProfile } from "@/lib/search";
import { geocode } from "@/lib/geocode";

const schema = z.object({
  displayName: z.string().trim().min(2, "Nom affiché trop court").max(80),
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

  const avant = await db.profile.findUnique({ where: { userId: session.user.id }, select: { city: true, country: true, lat: true } });
  const lieuChange = !avant || avant.city !== (d.city || null) || avant.country !== (d.country || null) || avant.lat === null;
  const geo = lieuChange && d.city ? await geocode(d.city, d.country) : null;

  /* Ce que le membre représente : un attribut du compte, pas un compte à part.
     Les tables de détails (entreprise, association, artiste) sont créées à la demande. */
  await db.user.update({ where: { id: session.user.id }, data: { accountType: d.kind } });
  const pid = (await db.profile.findUnique({ where: { userId: session.user.id }, select: { id: true } }))!.id;
  if (d.kind === "COMPANY") await db.companyDetails.upsert({ where: { profileId: pid }, update: {}, create: { profileId: pid } });
  if (d.kind === "ASSOCIATION") await db.associationDetails.upsert({ where: { profileId: pid }, update: {}, create: { profileId: pid } });
  if (d.kind === "ARTIST") await db.artistDetails.upsert({ where: { profileId: pid }, update: {}, create: { profileId: pid } });

  const profile = await db.profile.update({
    where: { userId: session.user.id },
    data: {
      ...(lieuChange && { lat: geo?.lat ?? null, lng: geo?.lng ?? null }),
      displayName: d.displayName,
      city: d.city || null,
      country: d.country || null,
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

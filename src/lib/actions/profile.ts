"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { indexProfile } from "@/lib/search";

const schema = z.object({
  displayName: z.string().trim().min(2, "Nom affiché trop court").max(80),
  city: z.string().trim().max(80),
  country: z.string().trim().max(80),
  bio: z.string().trim().max(1500, "Bio limitée à 1 500 caractères"),
  website: z.union([z.literal(""), z.url("Adresse du site invalide")]),
  keywords: z.string().max(500),
  directory: z.string().optional(),
});

export type ProfileState = { error?: string; ok?: boolean };

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte/profil");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const keywordNames = [...new Set(d.keywords.split(",").map((k) => k.trim()).filter(Boolean))].slice(0, 15);

  const profile = await db.profile.update({
    where: { userId: session.user.id },
    data: {
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
  return { ok: true };
}

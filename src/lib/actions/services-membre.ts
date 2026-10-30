"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EXPERT_DOMAINS, EXPERT_MODES, HOSTING_KINDS, HOSTING_AUDIENCES } from "@/lib/competences";

/* Espace membre : proposer ses compétences (relues par le HCBE) et sa fiche d'accueil
   (relue avant publication). Aucune coordonnée n'est publiée : les contacts passent
   par la messagerie relais du profil. */

export type MemberServiceState = { ok?: boolean; error?: string; message?: string };

async function myProfileId() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte");
  const p = await db.profile.findUnique({ where: { userId: session.user.id }, select: { id: true, slug: true } });
  if (!p) redirect("/compte/profil");
  return p;
}

/* ---------- Compétences ---------- */

const expertSchema = z.object({
  domain: z.enum(EXPERT_DOMAINS, { error: "Choisissez un domaine." }),
  pitch: z.string().trim().min(40, "Décrivez ce que vous proposez (40 caractères minimum).").max(1200, "Description limitée à 1 200 caractères."),
  charter: z.literal("on", { error: "Vous devez accepter que le HCBE relise votre proposition." }),
});

export async function proposeExpertAction(_prev: MemberServiceState, formData: FormData): Promise<MemberServiceState> {
  const p = await myProfileId();
  const parsed = expertSchema.safeParse({ domain: formData.get("domain"), pitch: formData.get("pitch"), charter: formData.get("charter") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const modes = formData.getAll("modes").map(String).filter((m) => EXPERT_MODES.some((x) => x.value === m));
  if (modes.length === 0) return { error: "Cochez au moins une façon de contribuer." };
  await db.profile.update({
    where: { id: p.id },
    data: { expertDomain: parsed.data.domain, expertModes: modes, expertPitch: parsed.data.pitch, expertStatus: "PENDING", expertAt: new Date() },
  });
  revalidatePath("/compte/competences");
  revalidatePath("/admin/competences");
  return { ok: true, message: "Proposition envoyée : le HCBE la relit avant de la publier dans la rubrique Compétences." };
}

export async function withdrawExpertAction(): Promise<MemberServiceState> {
  const p = await myProfileId();
  await db.profile.update({ where: { id: p.id }, data: { expertStatus: "NONE", expertAt: new Date() } });
  revalidatePath("/compte/competences");
  revalidatePath("/communaute/competences");
  revalidatePath("/admin/competences");
  return { ok: true, message: "Votre profil n'apparaît plus dans les compétences. Vos informations sont conservées si vous changez d'avis." };
}

/* ---------- Accueil & hébergement ---------- */

const hostingSchema = z.object({
  kind: z.enum(HOSTING_KINDS.map((k) => k.value) as [string, ...string[]], { error: "Choisissez un type d'accueil." }),
  city: z.string().trim().min(2, "Indiquez la ville.").max(80),
  country: z.string().trim().min(2, "Indiquez le pays.").max(80),
  capacity: z.preprocess((v) => (typeof v === "string" && v.trim() ? Number(v) : undefined), z.number().int().min(1).max(20).optional()),
  duration: z.string().trim().max(120).optional(),
  conditions: z.string().trim().min(30, "Précisez les conditions (30 caractères minimum).").max(1500, "Conditions limitées à 1 500 caractères."),
  charter: z.literal("on", { error: "Vous devez accepter la charte de l'accueil." }),
});

export async function saveHostingAction(_prev: MemberServiceState, formData: FormData): Promise<MemberServiceState> {
  const p = await myProfileId();
  const parsed = hostingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const audience = formData.getAll("audience").map(String).filter((a) => HOSTING_AUDIENCES.some((x) => x.value === a));
  if (audience.length === 0) return { error: "Cochez au moins un public accueilli." };
  const d = parsed.data;
  const existing = await db.hostingOffer.findUnique({ where: { profileId: p.id }, select: { city: true, country: true, charterAt: true } });
  const data = {
    kind: d.kind as "ROOM" | "WHOLE" | "FAMILY",
    audience,
    city: d.city,
    country: d.country,
    capacity: d.capacity ?? null,
    duration: d.duration || null,
    conditions: d.conditions,
    status: "IN_MODERATION" as const,
  };
  await db.hostingOffer.upsert({
    where: { profileId: p.id },
    update: data,
    create: { ...data, profileId: p.id, charterAt: existing?.charterAt ?? new Date() },
  });
  revalidatePath("/compte/accueil");
  revalidatePath("/admin/services");
  return { ok: true, message: existing ? "Fiche mise à jour : elle repasse par la relecture du HCBE avant d'être visible." : "Fiche envoyée : le HCBE échange avec vous avant la mise en ligne." };
}

export async function withdrawHostingAction(): Promise<MemberServiceState> {
  const p = await myProfileId();
  await db.hostingOffer.updateMany({ where: { profileId: p.id }, data: { status: "ARCHIVED" } });
  revalidatePath("/compte/accueil");
  revalidatePath("/pratique/accueil");
  revalidatePath("/admin/services");
  return { ok: true, message: "Fiche retirée : elle n'est plus visible. Vous pouvez la réactiver en l'enregistrant de nouveau." };
}

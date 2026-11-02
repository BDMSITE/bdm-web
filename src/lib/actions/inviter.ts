"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendFriendInvite } from "@/lib/mail";
import { rateLimit } from "@/lib/ratelimit";
import { SITE_URL } from "@/lib/site-url";

/* « Inviter mes proches » : un membre envoie jusqu'à 5 invitations à la fois (20 par jour),
   avec un mot personnel. Les adresses déjà inscrites ne reçoivent rien. */

export type InviteFriendsState = { ok?: boolean; error?: string; message?: string };

const schema = z.object({
  emails: z.string().max(600),
  message: z.string().trim().max(400, "Message limité à 400 caractères").optional(),
});

export async function inviteFriendsAction(_prev: InviteFriendsState, formData: FormData): Promise<InviteFriendsState> {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte/inviter");
  const parsed = schema.safeParse({ emails: formData.get("emails") ?? "", message: formData.get("message") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const emails = [...new Set(parsed.data.emails.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (emails.length === 0) return { error: "Indiquez au moins une adresse e-mail." };
  if (emails.length > 5) return { error: "5 adresses maximum à la fois." };
  const invalides = emails.filter((e) => !z.email().safeParse(e).success);
  if (invalides.length) return { error: `Adresse invalide : ${invalides[0]}` };
  if (!(await rateLimit(`invite:${session.user.id}`, 20, 86400))) return { error: "Vous avez déjà envoyé 20 invitations aujourd'hui : réessayez demain." };

  const me = await db.profile.findUnique({ where: { userId: session.user.id }, select: { displayName: true, slug: true } });
  const dejaInscrits = new Set((await db.user.findMany({ where: { email: { in: emails } }, select: { email: true } })).map((u) => u.email));
  let envoyes = 0;
  for (const email of emails) {
    if (dejaInscrits.has(email)) continue;
    try {
      await sendFriendInvite(email, { from: me?.displayName ?? "Un membre", message: parsed.data.message ?? "", url: `${SITE_URL}/inscription`, profileUrl: me ? `${SITE_URL}/communaute/membres/${me.slug}` : SITE_URL });
      envoyes++;
    } catch (e) {
      console.error("[inviter] envoi impossible", email, e);
    }
  }
  const deja = emails.length - envoyes;
  return { ok: true, message: `${envoyes} invitation${envoyes > 1 ? "s" : ""} envoyée${envoyes > 1 ? "s" : ""}${deja ? ` · ${deja} adresse${deja > 1 ? "s" : ""} déjà inscrite${deja > 1 ? "s" : ""} ou non envoyée${deja > 1 ? "s" : ""}` : ""}.` };
}

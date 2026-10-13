"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { auth, signIn } from "@/lib/auth";
import { db } from "@/lib/db";

/* Invitations des comptes importés : le lien magique d'Auth.js sert de lien
   d'activation (le compte passe ACTIVE au clic). Envoi par lots pour rester
   sous le quota e-mail gratuit (Brevo : 300/jour). */

const STAFF = new Set(["EDITOR", "MODERATOR", "ADMIN"]);
const RELANCE_APRES_JOURS = 7;

export type InviteState = { envoyees?: number; erreurs?: number; error?: string };

export async function sendInvitationsAction(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const session = await auth();
  if (!session?.user || !STAFF.has(session.user.role ?? "")) return { error: "Accès réservé à l'administration." };

  const lot = Math.min(Math.max(Number(formData.get("lot") ?? 50), 1), 250);
  const limite = new Date(Date.now() - RELANCE_APRES_JOURS * 864e5);

  const cibles = await db.user.findMany({
    where: {
      status: "PENDING_EMAIL",
      importedFrom: { not: null },
      OR: [{ invitedAt: null }, { invitedAt: { lt: limite } }],
    },
    orderBy: [{ invitedAt: "asc" }, { createdAt: "asc" }],
    take: lot,
    select: { id: true, email: true },
  });

  let envoyees = 0;
  let erreurs = 0;
  for (const u of cibles) {
    try {
      await signIn("resend", { email: u.email, redirect: false, redirectTo: "/compte/profil" });
      await db.user.update({ where: { id: u.id }, data: { invitedAt: new Date() } });
      envoyees++;
    } catch (e) {
      if (!(e instanceof AuthError)) throw e;
      erreurs++;
    }
  }

  revalidatePath("/admin/imports");
  return { envoyees, erreurs };
}

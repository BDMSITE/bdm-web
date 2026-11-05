import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripeConfig } from "@/lib/stripe";
import { confirmerStripe } from "@/lib/adhesion-paiement";

/* Retour de paiement. Stripe (success_url) : la session est relue côté serveur avant toute
   activation. KKiaPay (callback du widget ou « Déjà payé ? Vérifier ») : l'activation vient de
   la vérification faite après le widget ou du webhook ; ici on constate l'état. Aucune donnée
   de l'URL n'est utilisée. */

export const dynamic = "force-dynamic";

export default async function RetourPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const [session, sp] = await Promise.all([auth(), searchParams]);
  if (!sp.m) notFound();
  const m = await db.membership.findFirst({ where: { id: sp.m, userId: session!.user.id }, select: { status: true, provider: true } });
  if (!m) notFound();
  if (m.provider === "STRIPE" && m.status === "PENDING") {
    const r = await confirmerStripe(sp.m, (await stripeConfig()).mode, session!.user.id);
    redirect(`/compte/adhesion?etat=${r === "inconnu" ? "refuse" : r}`);
  }
  redirect(m.status === "ACTIVE" ? "/compte/adhesion?etat=active" : m.status === "PENDING" ? "/compte/adhesion?etat=attente" : "/compte/adhesion?etat=refuse");
}

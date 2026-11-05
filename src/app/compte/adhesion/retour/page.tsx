import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { confirmerRetour } from "@/lib/adhesion-paiement";

/* Retour de FedaPay (callback_url ou fermeture du widget). Le paramètre `status` de l'URL
   n'est jamais lu : la transaction est relue à la source, puis l'adhésion est activée
   (ou la tentative annulée) et le membre renvoyé sur Mon adhésion. */

export const dynamic = "force-dynamic";

export default async function RetourPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const [session, sp] = await Promise.all([auth(), searchParams]);
  if (!sp.m) notFound();
  const r = await confirmerRetour(sp.m, session!.user.id);
  if (r === "inconnu") notFound();
  redirect(r === "active" ? "/compte/adhesion?etat=active" : `/compte/adhesion?etat=${r}`);
}

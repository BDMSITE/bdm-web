import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { kkiapayConfig } from "@/lib/kkiapay";
import { PLAN_LABEL } from "@/lib/adhesion";
import { KkiapayCheckout } from "./checkout";

export const metadata: Metadata = { title: "Paiement de l'adhésion" };

/* Étape de paiement : le widget KKiaPay s'ouvre sur le site avec le montant figé côté serveur
   et l'identifiant d'adhésion (data). Au succès, le navigateur transmet l'identifiant de
   transaction au serveur, qui le vérifie auprès de KKiaPay avant d'activer. Le webhook fait
   la même vérification de son côté (utile si le navigateur se ferme avant). */

export default async function PayerPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const [session, sp] = await Promise.all([auth(), searchParams]);
  if (!sp.m) notFound();
  const m = await db.membership.findFirst({
    where: { id: sp.m, userId: session!.user.id },
    select: { id: true, status: true, plan: true, displayAmount: true, amount: true, live: true, provider: true, paymentUrl: true, user: { select: { email: true, profile: { select: { displayName: true } } } } },
  });
  if (!m) notFound();
  if (m.status === "ACTIVE") redirect("/compte/adhesion?etat=active");
  if (m.status !== "PENDING") redirect("/compte/adhesion?etat=refuse");
  if (m.provider === "STRIPE") redirect(m.paymentUrl || "/compte/adhesion");
  const kkia = await kkiapayConfig();
  /* L'adhésion a été préparée dans un mode (test / réel) ; si l'admin a basculé depuis, on repart de Mon adhésion. */
  if (!kkia.ready || m.live !== kkia.live) redirect("/compte/adhesion");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Paiement de l&apos;adhésion</h1>
        <p className="mt-1 text-sm text-ink-2">{PLAN_LABEL[m.plan]} · {m.displayAmount}{m.displayAmount?.endsWith("FCFA") ? "" : ` (débité ${m.amount.toLocaleString("fr-FR")} FCFA)`}</p>
      </div>
      <section className="border border-line p-5">
        <KkiapayCheckout publicKey={kkia.publicKey} sandbox={!m.live} amountXof={m.amount} membershipId={m.id} email={m.user.email} name={m.user.profile?.displayName ?? ""} />
        {!m.live && <p className="mt-4 rounded border border-accent bg-accent-light px-3 py-2 text-xs">Mode test KKiaPay (sandbox) : aucun argent réel n&apos;est débité. Numéro de test MTN Bénin : 22961000000.</p>}
      </section>
      <p className="text-sm"><Link href="/compte/adhesion" className="font-semibold text-primary hover:underline">← Revenir sans payer</Link></p>
    </div>
  );
}

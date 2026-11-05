import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { FEDAPAY_PUBLIC_KEY, FEDAPAY_LIVE } from "@/lib/fedapay";
import { PLAN_LABEL } from "@/lib/adhesion";
import { FedaPayCheckout } from "./checkout";

export const metadata: Metadata = { title: "Paiement de l'adhésion" };

/* Étape de paiement : le widget FedaPay (checkout.js) s'ouvre sur le site avec la transaction
   déjà créée côté serveur ; en repli, un lien vers la page de paiement FedaPay. À la fermeture
   du widget, retour vers /compte/adhesion/retour qui relit la transaction à la source. */

export default async function PayerPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const [session, sp] = await Promise.all([auth(), searchParams]);
  if (!sp.m) notFound();
  const m = await db.membership.findFirst({
    where: { id: sp.m, userId: session!.user.id },
    select: { id: true, status: true, plan: true, displayAmount: true, amount: true, paymentRef: true, paymentUrl: true, user: { select: { email: true, profile: { select: { displayName: true } } } } },
  });
  if (!m) notFound();
  if (m.status === "ACTIVE") redirect("/compte/adhesion");
  if (m.status !== "PENDING" || !m.paymentRef || !m.paymentUrl) redirect("/compte/adhesion?etat=refuse");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Paiement de l&apos;adhésion</h1>
        <p className="mt-1 text-sm text-ink-2">{PLAN_LABEL[m.plan]} · {m.displayAmount}{m.displayAmount?.endsWith("FCFA") ? "" : ` (débité ${m.amount.toLocaleString("fr-FR")} FCFA)`}</p>
      </div>
      <section className="border border-line p-5">
        <FedaPayCheckout publicKey={FEDAPAY_PUBLIC_KEY} transactionId={Number(m.paymentRef)} membershipId={m.id} fallbackUrl={m.paymentUrl} email={m.user.email} name={m.user.profile?.displayName ?? ""} />
        {!FEDAPAY_LIVE && <p className="mt-4 rounded border border-accent bg-accent-light px-3 py-2 text-xs">Mode test FedaPay (sandbox) : aucun argent réel n&apos;est débité.</p>}
      </section>
      <p className="text-sm"><Link href="/compte/adhesion" className="font-semibold text-primary hover:underline">← Revenir sans payer</Link></p>
    </div>
  );
}

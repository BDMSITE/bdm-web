"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { confirmPaymentAction } from "@/lib/actions/adhesion";

/* Widget KKiaPay (k.js) : ouvre le paiement sur le site. Au succès, l'identifiant de transaction
   est transmis au serveur, qui vérifie auprès de KKiaPay (statut, montant, adhésion) avant
   d'activer. Rien n'est activé sur la seule parole du navigateur. */

type KkiaResponse = { transactionId?: string };
declare global {
  interface Window {
    openKkiapayWidget?: (options: Record<string, unknown>) => void;
    addSuccessListener?: (cb: (r: KkiaResponse) => void) => void;
    addFailedListener?: (cb: (e: unknown) => void) => void;
  }
}

const SCRIPT = "https://cdn.kkiapay.me/k.js";

export function KkiapayCheckout({ publicKey, sandbox, amountXof, membershipId, email, name }: { publicKey: string; sandbox: boolean; amountXof: number; membershipId: string; email: string; name: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [etat, setEtat] = useState<"pret" | "verif" | "attente" | "refuse" | "erreur">("pret");
  const listeners = useRef(false);

  const verifier = useCallback(async (transactionId: string) => {
    setEtat("verif");
    const r = await confirmPaymentAction(membershipId, transactionId).catch(() => "attente" as const);
    if (r === "active") router.push("/compte/adhesion?etat=active");
    else if (r === "attente") setEtat("attente");
    else setEtat("refuse");
  }, [membershipId, router]);

  useEffect(() => {
    if (!ready || listeners.current || !window.addSuccessListener) return;
    listeners.current = true;
    window.addSuccessListener((r) => {
      if (r?.transactionId) void verifier(String(r.transactionId));
      else setEtat("attente");
    });
    window.addFailedListener?.(() => setEtat("erreur"));
  }, [ready, verifier]);

  const ouvrir = () => {
    if (!window.openKkiapayWidget) return;
    setEtat("pret");
    window.openKkiapayWidget({
      amount: amountXof,
      key: publicKey,
      sandbox,
      data: membershipId,
      email,
      name,
      position: "center",
      theme: "#008751",
      callback: `${window.location.origin}/compte/adhesion/retour?m=${membershipId}`,
    });
  };

  return (
    <div className="space-y-3">
      <Script src={SCRIPT} strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setReady(false)} />
      <p className="text-sm text-ink-2">Choisissez Mobile Money, carte bancaire ou wallet dans la fenêtre KKiaPay. Le site ne voit jamais vos numéros.</p>
      {etat === "attente" && <p role="status" className="rounded border border-accent bg-accent-light px-3 py-2.5 text-sm">Paiement reçu, confirmation en cours. Votre adhésion s&apos;activera dès que KKiaPay nous aura confirmé la transaction (quelques minutes au plus).</p>}
      {etat === "refuse" && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">Cette transaction n&apos;a pas pu être validée. Si vous avez été débité·e, écrivez au HCBE avec l&apos;heure du paiement : nous l&apos;activerons à la main.</p>}
      {etat === "erreur" && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">Le paiement n&apos;a pas abouti (refusé ou abandonné). Rien n&apos;a été débité : vous pouvez réessayer.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={ouvrir} disabled={!ready || etat === "verif" || etat === "attente"} className="rounded bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {etat === "verif" ? "Vérification du paiement…" : ready ? (etat === "erreur" || etat === "refuse" ? "Réessayer" : "Payer maintenant") : "Chargement du paiement…"}
        </button>
        <a href={`/compte/adhesion/retour?m=${membershipId}`} className="text-sm font-semibold text-primary hover:underline">Déjà payé ? Vérifier</a>
      </div>
      <p className="text-xs text-muted">Si la fenêtre ne s&apos;ouvre pas (bloqueur de contenu, réseau lent), rechargez la page. Un paiement déjà effectué est confirmé par KKiaPay même si vous fermez cette page.</p>
    </div>
  );
}

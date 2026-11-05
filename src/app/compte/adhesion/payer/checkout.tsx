"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

/* Widget FedaPay Checkout.js : ouvre la transaction créée côté serveur dans une fenêtre
   de paiement sur le site. Quelle que soit l'issue, le navigateur part sur la page de
   retour, qui relit la transaction auprès de FedaPay avant d'activer quoi que ce soit. */

type FedaPayGlobal = {
  init: (selector: string, options: Record<string, unknown>) => void;
  CHECKOUT_COMPLETED: string;
  DIALOG_DISMISSED: string;
};
declare global {
  interface Window { FedaPay?: FedaPayGlobal }
}

export function FedaPayCheckout({ publicKey, transactionId, membershipId, fallbackUrl, email, name }: { publicKey: string; transactionId: number; membershipId: string; fallbackUrl: string; email: string; name: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [fini, setFini] = useState(false);
  const init = useRef(false);
  const retour = `/compte/adhesion/retour?m=${membershipId}&id=${transactionId}`;

  useEffect(() => {
    if (!ready || init.current || !window.FedaPay) return;
    init.current = true;
    const [firstname, ...rest] = name.trim().split(/\s+/);
    window.FedaPay.init("#fedapay-btn", {
      public_key: publicKey,
      locale: "fr",
      transaction: { id: transactionId },
      customer: { email, firstname: firstname || "Membre", lastname: rest.join(" ") || "BDM" },
      onComplete: () => {
        setFini(true);
        router.push(retour);
      },
    });
  }, [ready, publicKey, transactionId, email, name, retour, router]);

  return (
    <div className="space-y-3">
      <Script src="https://cdn.fedapay.com/checkout.js?v=1.1.7" strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setReady(false)} />
      <p className="text-sm text-ink-2">Choisissez Mobile Money ou carte bancaire dans la fenêtre FedaPay. Le site ne voit jamais vos numéros.</p>
      <div className="flex flex-wrap items-center gap-3">
        <button id="fedapay-btn" type="button" disabled={!ready || fini} className="rounded bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {fini ? "Vérification du paiement…" : ready ? "Payer maintenant" : "Chargement du paiement…"}
        </button>
        <a href={fallbackUrl} className="text-sm font-semibold text-primary hover:underline">Ouvrir la page de paiement FedaPay</a>
      </div>
      <p className="text-xs text-muted">Si la fenêtre ne s&apos;ouvre pas (bloqueur de contenu, réseau lent), utilisez le lien : vous reviendrez ici automatiquement après paiement. Déjà payé ? <a href={retour} className="font-semibold text-primary hover:underline">Vérifier mon paiement</a>.</p>
    </div>
  );
}

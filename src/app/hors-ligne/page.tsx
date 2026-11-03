import Link from "next/link";
import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { OfflineGuidesList } from "@/components/site/offline";

export const metadata: Metadata = { title: "Hors connexion", robots: { index: false } };

/* Page servie par le service worker quand le réseau manque : les guides enregistrés restent lisibles. */

export default function HorsLignePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-12">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Béninois du Monde</p>
      <h1 className="font-display mt-2 flex items-center gap-3 text-3xl font-black"><WifiOff aria-hidden className="h-8 w-8 text-primary" /> Vous êtes hors connexion</h1>
      <p className="mt-3 text-ink-2">Cette page n&apos;est pas disponible sans réseau. Les guides que vous avez enregistrés restent lisibles ci-dessous ; le reste du site revient dès que la connexion est rétablie.</p>
      <div className="mt-8"><OfflineGuidesList /></div>
      <p className="mt-8 text-sm"><Link href="/" className="font-bold text-primary hover:underline">Réessayer la page d&apos;accueil</Link></p>
    </main>
  );
}

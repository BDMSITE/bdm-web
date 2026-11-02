import Image from "next/image";
import Link from "next/link";

/* Page affichée aux visiteurs quand le mode maintenance est activé dans Paramètres.
   Les administrateurs connectés voient le site normalement, avec un bandeau. */

export function MaintenancePage({ message }: { message: string }) {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-16 text-center">
      <meta name="robots" content="noindex" />
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Béninois du Monde</p>
      <h1 className="section-title mt-4 text-3xl md:text-4xl">
        Site en <em>maintenance</em>
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-2">{message}</p>
      <div className="mt-8 flex items-center gap-3 text-xs text-muted">
        <Image src="/images/logo-hcbe.png" alt="HCBE" width={96} height={34} className="h-8 w-auto" />
        <span>Partenaire officiel du Haut Conseil des Béninois de l&apos;Extérieur</span>
      </div>
      <Link href="/connexion" className="mt-10 text-xs text-muted hover:text-primary">Accès administration</Link>
    </main>
  );
}

export function MaintenanceBanner() {
  return (
    <div role="status" className="bg-danger px-4 py-2 text-center text-sm font-bold text-white">
      Mode maintenance activé : les visiteurs voient la page d&apos;attente. Vous voyez le site parce que vous êtes connecté·e à l&apos;administration.{" "}
      <Link href="/admin/parametres" className="underline">Désactiver</Link>
    </div>
  );
}

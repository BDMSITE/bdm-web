import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { verifyToken } from "@/lib/signed-token";
import { otpauthUrl } from "@/lib/totp";
import { ConfirmTwoFactorForm } from "./form";

export const metadata: Metadata = { title: "Activer la double authentification" };

/* Activation : QR code (secret du cookie signé) + premier code à valider. */

export default async function TwoFactorSetupPage() {
  const [session, jar] = await Promise.all([auth(), cookies()]);
  const setup = verifyToken<{ uid: string; secret: string }>(jar.get("bdm_2fa_setup")?.value, "2fa-setup");
  if (!session?.user || !setup || setup.uid !== session.user.id) redirect("/compte/securite");
  const url = otpauthUrl(setup.secret, session.user.email ?? "compte");
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: "#0b3d2e", light: "#ffffff" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Activer la double authentification</h1>
        <p className="mt-1 text-sm text-ink-2">Trois étapes, deux minutes. Vous aurez besoin d&apos;une application d&apos;authentification (Google Authenticator, Authy, Bitwarden, 1Password…).</p>
      </div>
      <ol className="space-y-5 border border-line p-5 text-sm">
        <li className="flex gap-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">1</span>
          <div>
            <p className="font-bold">Scannez ce QR code avec l&apos;application</p>
            <Image src={qr} alt="QR code à scanner dans votre application d'authentification" width={220} height={220} unoptimized className="mt-3 border border-line" />
            <p className="mt-2 text-xs text-muted">Impossible de scanner ? Saisissez cette clé à la main : <code className="select-all font-mono text-sm text-ink">{setup.secret.match(/.{1,4}/g)?.join(" ")}</code></p>
          </div>
        </li>
        <li className="flex gap-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">2</span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">Saisissez le code affiché pour confirmer</p>
            <ConfirmTwoFactorForm />
          </div>
        </li>
        <li className="flex gap-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">3</span>
          <p>À chaque connexion par mot de passe, le site vous demandera le code de l&apos;application. Gardez l&apos;accès à votre téléphone.</p>
        </li>
      </ol>
    </div>
  );
}

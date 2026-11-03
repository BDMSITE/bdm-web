import type { Metadata } from "next";
import { Public_Sans, Caveat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE_URL } from "@/lib/site-url";
import { DEFAULT_OG } from "@/lib/og";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { maintenance } from "@/lib/settings";
import { MaintenancePage, MaintenanceBanner } from "@/components/site/maintenance";
import { OfflineRegister } from "@/components/site/offline";

const STAFF = new Set(["EDITOR", "MODERATOR", "REGIE", "ADMIN"]);

/* Typo « administrative » : Public Sans — la police officielle open source
   du design system du gouvernement américain (USWDS), même esprit que la
   Marianne de l'État français. Une seule famille = rendu institutionnel.
   Graisses fortes (700/800) pour les titres, 400/600 pour le texte.
   Caveat = manuscrite pour le mot mis en avant des titres (façon modèle RDM). */

const display = Public_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const body = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const script = Caveat({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: { type: "website", siteName: "Béninois du Monde", locale: "fr_FR", images: [DEFAULT_OG] },
  twitter: { card: "summary_large_image" },
  title: {
    default: "Béninois du Monde",
    template: "%s — Béninois du Monde",
  },
  description:
    "Le média et le réseau des Béninois où qu'ils vivent : emploi, communauté, bonnes adresses, agenda, mémoire et racines.",
};

/* Chemins qui restent ouverts en maintenance : connexion de l'équipe et back-office. */
const OUVERT_EN_MAINTENANCE = ["/admin", "/connexion", "/en/sign-in", "/api", "/hors-ligne"];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [maint, h] = await Promise.all([maintenance().catch(() => ({ on: false, message: "" })), headers()]);
  const path = h.get("x-pathname") ?? "/";
  let contenu: React.ReactNode = children;
  let bandeau = false;
  if (maint.on && !OUVERT_EN_MAINTENANCE.some((p) => path === p || path.startsWith(p + "/"))) {
    const session = await auth().catch(() => null);
    if (session?.user && STAFF.has(session.user.role ?? "")) bandeau = true;
    else contenu = <MaintenancePage message={maint.message} />;
  }
  return (
    <html
      lang="fr"
      className={`${display.variable} ${body.variable} ${script.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="tricolor" aria-hidden />
        {bandeau && <MaintenanceBanner />}
        {contenu}
        <OfflineRegister />
        <Analytics />
      </body>
    </html>
  );
}

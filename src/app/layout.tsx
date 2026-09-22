import type { Metadata } from "next";
import { Public_Sans, Caveat } from "next/font/google";
import "./globals.css";

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
  title: {
    default: "Béninois du Monde",
    template: "%s — Béninois du Monde",
  },
  description:
    "Le média et le réseau des Béninois où qu'ils vivent : emploi, communauté, bonnes adresses, agenda, mémoire et racines.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${body.variable} ${script.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="tricolor" aria-hidden />
        {children}
      </body>
    </html>
  );
}

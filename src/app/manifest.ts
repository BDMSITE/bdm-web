import type { MetadataRoute } from "next";

/* Manifeste d'application : ajout à l'écran d'accueil (Android, Chrome), nom court,
   couleurs de la charte, icônes générées par /api/icone. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Béninois du Monde",
    short_name: "BdM",
    description: "Le média et le réseau de la diaspora béninoise : emploi, communauté, bonnes adresses, agenda, mémoire et racines.",
    start_url: "/",
    display: "standalone",
    lang: "fr",
    background_color: "#ffffff",
    theme_color: "#008751",
    icons: [
      { src: "/api/icone?s=192", sizes: "192x192", type: "image/png" },
      { src: "/api/icone?s=512", sizes: "512x512", type: "image/png" },
      { src: "/api/icone?s=512&m=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

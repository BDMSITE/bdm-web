import { cache } from "react";
import { db } from "./db";

/* Réglages modifiables dans Paramètres. Chaque clé a un libellé, un type et
   un repli (variable d'environnement). Lus une fois par rendu (cache React). */

export const SOCIAL_NETWORKS = [
  { key: "social.facebook", label: "Facebook", env: "NEXT_PUBLIC_SOCIAL_FACEBOOK" },
  { key: "social.linkedin", label: "LinkedIn", env: "NEXT_PUBLIC_SOCIAL_LINKEDIN" },
  { key: "social.instagram", label: "Instagram", env: "NEXT_PUBLIC_SOCIAL_INSTAGRAM" },
  { key: "social.x", label: "X (Twitter)", env: "NEXT_PUBLIC_SOCIAL_X" },
  { key: "social.youtube", label: "YouTube", env: "NEXT_PUBLIC_SOCIAL_YOUTUBE" },
  { key: "social.tiktok", label: "TikTok", env: "NEXT_PUBLIC_SOCIAL_TIKTOK" },
  { key: "social.whatsapp", label: "WhatsApp (lien wa.me)", env: "NEXT_PUBLIC_SOCIAL_WHATSAPP" },
] as const;

/* Réglages chiffrés (quotas). Vide = valeur par défaut. */
export const NUMBER_SETTINGS = [
  { key: "quota.offres", label: "Offres d'emploi et stages gratuites par recruteur", hint: "Offres en ligne ou en attente comptées ensemble. Au-delà, le recruteur est invité à contacter le HCBE.", default: 3, min: 0, max: 1000 },
  { key: "quota.mails.jour", label: "E-mails de masse par jour (newsletter + alertes)", hint: "Brevo gratuit : 300 par jour. Marge gardée pour les e-mails de connexion et de relais.", default: 250, min: 10, max: 100000 },
  /* Adhésion HCBE (décision du 05/11/2026) : prix en euros, convertis en FCFA à parité fixe pour l'encaissement ;
     équivalents en dollars affichés aux membres des États-Unis et du Canada (à ajuster si le change bouge). */
  { key: "adhesion.prix", label: "Adhésion HCBE : prix annuel (€)", hint: "Encaissé en FCFA via FedaPay à parité fixe (1 € = 655,957 FCFA).", default: 20, min: 1, max: 1000 },
  { key: "adhesion.prix_reduit", label: "Adhésion HCBE : tarif réduit jeunes ≤ 20 ans et étudiants (€)", hint: "Déclaration sur l'honneur du membre.", default: 5, min: 0, max: 1000 },
  { key: "adhesion.prix_usd", label: "Adhésion : équivalent affiché aux États-Unis ($ US)", hint: "Indicatif : la banque du membre convertit depuis le FCFA.", default: 23, min: 1, max: 2000 },
  { key: "adhesion.prix_usd_reduit", label: "Adhésion : tarif réduit affiché aux États-Unis ($ US)", hint: "", default: 6, min: 0, max: 2000 },
  { key: "adhesion.prix_cad", label: "Adhésion : équivalent affiché au Canada ($ CA)", hint: "Indicatif.", default: 31, min: 1, max: 2000 },
  { key: "adhesion.prix_cad_reduit", label: "Adhésion : tarif réduit affiché au Canada ($ CA)", hint: "", default: 8, min: 0, max: 2000 },
] as const;

export type SettingKey = (typeof SOCIAL_NETWORKS)[number]["key"] | (typeof NUMBER_SETTINGS)[number]["key"];

/** Valeur chiffrée d'un réglage, avec son défaut. */
export async function numberSetting(key: (typeof NUMBER_SETTINGS)[number]["key"]) {
  const def = NUMBER_SETTINGS.find((n) => n.key === key)!;
  const raw = (await getSettings())[key];
  const n = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(n) ? Math.min(def.max, Math.max(def.min, Math.round(n))) : def.default;
}

export const getSettings = cache(async (): Promise<Record<string, string>> => {
  const rows = await db.siteSetting.findMany().catch(() => []);
  const out: Record<string, string> = {};
  for (const n of SOCIAL_NETWORKS) {
    const envValue = process.env[n.env] ?? "";
    if (/^https?:\/\//.test(envValue)) out[n.key] = envValue;
  }
  for (const r of rows) if (r.value.trim()) out[r.key] = r.value.trim();
  return out;
});

/** Réseaux à afficher : tous, avec leur lien s'il est configuré. */
export async function socialLinks() {
  const settings = await getSettings();
  return SOCIAL_NETWORKS.map((n) => ({ key: n.key.replace("social.", ""), label: n.label, url: settings[n.key] ?? "" }));
}

/* Mode maintenance : « 1 » ferme le site aux visiteurs ; message affiché sur la page d'attente. */
export const MAINTENANCE_KEY = "maintenance";
export const MAINTENANCE_MESSAGE_KEY = "maintenance.message";
export const MAINTENANCE_DEFAULT_MESSAGE = "Nous intervenons sur le site : il revient très bientôt, avec des nouveautés. Merci de votre patience.";

export async function maintenance() {
  const s = await getSettings();
  return { on: s[MAINTENANCE_KEY] === "1", message: s[MAINTENANCE_MESSAGE_KEY] || MAINTENANCE_DEFAULT_MESSAGE };
}

/* Interrupteurs oui / non (Paramètres → Sécurité & validation). */
export const FLAG_SETTINGS = [
  { key: "securite.2fa_equipe", label: "Double authentification obligatoire pour l'équipe", hint: "Toute personne ayant accès au back-office doit activer la 2FA avant d'y entrer. Recommandé avant l'ouverture." },
  { key: "communaute.validation_pro", label: "Valider les fiches entreprise, association et artiste avant leur publication dans les annuaires", hint: "Le membre reste visible comme particulier ; sa fiche pro apparaît dans l'annuaire concerné après validation (Admin → Communauté)." },
  { key: "communaute.recommandations_libres", label: "Publier les recommandations entre membres sans relecture", hint: "Par défaut, chaque recommandation (d'un membre ou d'une bonne adresse) passe par Admin → Modération avant d'apparaître. Activez pour les publier immédiatement ; le signalement reste possible." },
  { key: "adhesion.proposer", label: "Proposer l'adhésion HCBE aux membres (20 €/an, FedaPay)", hint: "Affiche « Mon adhésion » dans l'espace membre, le badge « Membre HCBE » et réserve aux adhérents les codes des bons plans et les offres au-delà du quota gratuit. Le paiement en ligne exige les clés FedaPay dans Vercel ; sans elles, l'admin active les adhésions à la main (Admin → Adhésions)." },
] as const;
export type FlagKey = (typeof FLAG_SETTINGS)[number]["key"];

export async function flag(key: FlagKey) {
  return (await getSettings())[key] === "1";
}

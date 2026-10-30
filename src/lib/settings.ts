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

export type SettingKey = (typeof SOCIAL_NETWORKS)[number]["key"];

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

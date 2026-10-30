/* Réseaux sociaux du HCBE / Béninois du Monde : affichés seulement si l'adresse
   est renseignée (variables NEXT_PUBLIC_SOCIAL_*), jamais de bouton mort. */
export const SOCIALS = [
  { key: "facebook", label: "Facebook", url: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? "" },
  { key: "linkedin", label: "LinkedIn", url: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? "" },
  { key: "instagram", label: "Instagram", url: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "" },
  { key: "x", label: "X (Twitter)", url: process.env.NEXT_PUBLIC_SOCIAL_X ?? "" },
  { key: "youtube", label: "YouTube", url: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? "" },
].filter((s) => /^https?:\/\//.test(s.url));

/* Compétences de la diaspora : référentiels partagés entre le formulaire membre,
   la page publique et le back-office. */

export const EXPERT_DOMAINS = [
  "Santé",
  "Ingénierie & numérique",
  "Droit & finance",
  "Enseignement & recherche",
  "Agriculture & agroalimentaire",
  "Énergie & environnement",
  "Culture, médias & communication",
  "Entrepreneuriat & commerce",
  "Administration & gouvernance",
  "Autre",
] as const;

export const EXPERT_MODES = [
  { value: "MENTORAT", label: "Mentorat (accompagner une personne ou une équipe)" },
  { value: "MISSION", label: "Mission courte sur place" },
  { value: "CONSEIL", label: "Conseil à distance" },
] as const;

export const EXPERT_MODE_LABEL: Record<string, string> = { MENTORAT: "Mentorat", MISSION: "Mission courte", CONSEIL: "Conseil à distance" };

export const EXPERT_STATUS_LABEL = { NONE: "Non proposé", PENDING: "En attente de validation", APPROVED: "Validé par le HCBE", REJECTED: "Non retenu" } as const;

export function expertModes(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string" && x in EXPERT_MODE_LABEL) : [];
}

/* Accueil & hébergement */

export const HOSTING_KINDS = [
  { value: "ROOM", label: "Une chambre chez moi" },
  { value: "WHOLE", label: "Un logement entier" },
  { value: "FAMILY", label: "Accueil en famille (repas, accompagnement)" },
] as const;

export const HOSTING_KIND_LABEL: Record<string, string> = { ROOM: "Chambre", WHOLE: "Logement entier", FAMILY: "Accueil en famille" };

export const HOSTING_AUDIENCES = [
  { value: "ETUDIANT", label: "Étudiants béninois qui arrivent" },
  { value: "VISITEUR", label: "Visiteurs de passage" },
  { value: "AFRODESCENDANT", label: "Afrodescendants en voyage au Bénin" },
] as const;

export const HOSTING_AUDIENCE_LABEL: Record<string, string> = { ETUDIANT: "Étudiants", VISITEUR: "Visiteurs", AFRODESCENDANT: "Afrodescendants" };

export function hostingAudience(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string" && x in HOSTING_AUDIENCE_LABEL) : [];
}

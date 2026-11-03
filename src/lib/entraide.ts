import type { HelpKind } from "@prisma/client";

/* Entraide (« Chercher / trouver ») : une demande est un besoin (« j'ai besoin d'aide »)
   ou une offre (« je peux aider »), rangée dans une catégorie, éventuellement urgente.
   Les membres volontaires d'une ville reçoivent un e-mail à chaque besoin publié chez eux. */

export const HELP_CATEGORIES = [
  "Hébergement d'urgence",
  "Traduction / interprétariat",
  "Accompagnement administratif",
  "Santé",
  "Juridique",
  "Transport / déplacement",
  "Rapatriement",
  "Mise en relation",
  "Autre",
] as const;

export const HELP_KIND_LABEL: Record<HelpKind, string> = { NEED: "J'ai besoin d'aide", OFFER: "Je peux aider" };
export const HELP_KIND_SHORT: Record<HelpKind, string> = { NEED: "Besoin d'aide", OFFER: "Offre d'aide" };

export function isHelpKind(v: unknown): v is HelpKind {
  return v === "NEED" || v === "OFFER";
}

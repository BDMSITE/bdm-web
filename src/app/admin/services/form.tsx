"use client";

import { NewContentPanel, type TypeOption } from "../contenus/content-form";

/* Services : panneau « Nouveau contenu » avec choix du type (adresse, événement,
   avantage, annonce, mise en relation). */

const TYPES: TypeOption[] = [
  { value: "PLACE", label: "Bonne adresse" },
  { value: "EVENT", label: "Événement (agenda)" },
  { value: "DEAL", label: "Avantage membres" },
  { value: "CLASSIFIED", label: "Petite annonce" },
  { value: "HELP_REQUEST", label: "Chercher / trouver (mise en relation)" },
];

export function ServiceContentPanel() {
  return <NewContentPanel label="Nouveau contenu" heading="Nouveau contenu de service" type="PLACE" typeOptions={TYPES} />;
}

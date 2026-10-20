"use client";

import { NewContentPanel, type TypeOption } from "../contenus/content-form";

/* Emploi : panneau « Nouvelle offre » (emploi ou stage), candidature par e-mail
   relais par défaut, date d'expiration. */

const TYPES: TypeOption[] = [
  { value: "JOB", label: "Offre d'emploi" },
  { value: "INTERNSHIP", label: "Stage / alternance / volontariat" },
];

export function JobOfferPanel() {
  return <NewContentPanel label="Nouvelle offre" heading="Nouvelle offre d'emploi ou de stage" type="JOB" typeOptions={TYPES} />;
}

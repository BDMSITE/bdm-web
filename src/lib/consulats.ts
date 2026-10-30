import { db } from "./db";

/* Représentations du Bénin à l'étranger (saisies dans l'admin). */

export const CONSULATE_KIND_LABEL: Record<string, string> = {
  AMBASSADE: "Ambassade",
  CONSULAT: "Consulat",
  CONSULAT_HONORAIRE: "Consulat honoraire",
  MISSION: "Mission permanente",
};

export function consulatesFor(country: string) {
  return db.consulate.findMany({ where: { country }, orderBy: [{ kind: "asc" }, { city: "asc" }] });
}

export function allConsulates() {
  return db.consulate.findMany({ orderBy: [{ country: "asc" }, { kind: "asc" }, { city: "asc" }] });
}

import type { ContentType } from "@prisma/client";

/* Libellés, rubriques et URL par type de contenu. */

export const CONTENT_LABEL: Record<ContentType, string> = {
  ARTICLE: "Article",
  MEMBER_ARTICLE: "Article membre",
  JOB: "Offre d'emploi",
  INTERNSHIP: "Stage",
  EVENT: "Événement",
  CLASSIFIED: "Annonce",
  PLACE: "Adresse",
  DEAL: "Avantage",
  HELP_REQUEST: "Mise en relation",
  MEMORY_PLACE: "Lieu de mémoire",
};

export const SECTION: Record<ContentType, string> = {
  ARTICLE: "/magazine",
  MEMBER_ARTICLE: "/magazine",
  JOB: "/emploi",
  INTERNSHIP: "/emploi",
  EVENT: "/agenda",
  CLASSIFIED: "/annonces",
  PLACE: "/adresses",
  DEAL: "/avantages",
  HELP_REQUEST: "/pratique/chercher-trouver",
  MEMORY_PLACE: "/memoire",
};

export function contentHref(type: ContentType, slug?: string) {
  return slug ? `${SECTION[type]}/${slug}` : SECTION[type];
}

export function profileHref(slug: string) {
  return `/communaute/membres/${slug}`;
}

export function keywordHref(slug: string) {
  return `/mot/${slug}`;
}

import type { ContentType } from "@prisma/client";

/* Libellés et URL par type de contenu. Les fiches détail dynamiques
   arrivent sprint par sprint (S2 magazine, S4 emploi…) : d'ici là, un
   contenu renvoie vers la liste de sa rubrique. */

export const CONTENT_LABEL: Record<ContentType, string> = {
  ARTICLE: "Article",
  MEMBER_ARTICLE: "Article membre",
  JOB: "Offre",
  INTERNSHIP: "Stage",
  EVENT: "Événement",
  CLASSIFIED: "Annonce",
  PLACE: "Adresse",
  DEAL: "Avantage",
  HELP_REQUEST: "Entraide",
  MEMORY_PLACE: "Lieu de mémoire",
};

const SECTION: Record<ContentType, string> = {
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

export function contentHref(type: ContentType) {
  return SECTION[type];
}

export function profileHref(slug: string) {
  return `/communaute/membres/${slug}`;
}

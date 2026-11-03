import type { Metadata } from "next";
import { SectionListPage, type SectionConfig, type SectionSearch } from "@/components/site/section-page";

export const metadata: Metadata = {
  title: "Entraide : chercher / trouver",
  description: "J'ai besoin d'aide, je peux aider : hébergement d'urgence, traduction, accompagnement administratif, santé, juridique, mises en relation entre Béninois du monde.",
};

/* Rubrique Entraide : besoins et offres d'aide des membres, par catégorie et par pays,
   relus par la modération. Les volontaires d'une ville sont prévenus de chaque besoin publié. */

const CONFIG: SectionConfig = {
  section: "/pratique/chercher-trouver",
  pre: "Entraide :",
  em: "chercher / trouver",
  desc: "« J'ai besoin d'aide » ou « je peux aider » : hébergement d'urgence, traduction, accompagnement administratif, santé, juridique, mise en relation. Entre membres, par le formulaire relais du site.",
  types: ["HELP_REQUEST"],
  categoriesFrom: "HELP_REQUEST",
  categoryLabel: "Toutes les catégories",
  helpKinds: true,
  placeholder: "Que cherchez-vous ? Que proposez-vous ?",
  publishLabel: "Publier un besoin ou une offre d'aide",
  empty: {
    title: "Aucune demande en cours",
    text: "Les besoins et les offres d'aide des membres apparaîtront ici dès leur relecture.",
  },
  cols: 2,
};

export default function Page({ searchParams }: { searchParams: SectionSearch }) {
  return <SectionListPage config={CONFIG} searchParams={searchParams} />;
}

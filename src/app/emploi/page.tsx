import type { Metadata } from "next";
import { SectionListPage, type SectionConfig, type SectionSearch } from "@/components/site/section-page";

export const metadata: Metadata = { title: "Offres d'emploi & stages" };

const CONFIG: SectionConfig = {
  section: "/emploi",
  pre: "Offres d'",
  em: "emploi & stages",
  desc: "Les offres publiées par les entreprises, associations et institutions pour les Béninois du monde : au Bénin, en Afrique et dans la diaspora.",
  types: [
    "JOB",
    "INTERNSHIP"
  ],
  placeholder: "Métier, entreprise, ville…",
  contractTypes: true,
  publishLabel: "Déposer une offre",
  empty: {
    title: "Aucune offre pour l'instant",
    text: "Les offres d'emploi et de stage apparaîtront ici dès qu'un recruteur en publiera une."
  },
  cols: 2
};

export default function Page({ searchParams }: { searchParams: SectionSearch }) {
  return <SectionListPage config={CONFIG} searchParams={searchParams} />;
}

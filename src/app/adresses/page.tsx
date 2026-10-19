import type { Metadata } from "next";
import { SectionListPage, type SectionConfig, type SectionSearch } from "@/components/site/section-page";

export const metadata: Metadata = { title: "Les bonnes adresses" };

const CONFIG: SectionConfig = {
  section: "/adresses",
  pre: "Les bonnes",
  em: "adresses",
  desc: "Restaurants, commerces et services béninois dans le monde, proposés par la communauté et vérifiés par la rédaction.",
  types: [
    "PLACE"
  ],
  placeholder: "Nom, ville…",
  categoriesFrom: "PLACE",
  publishLabel: "Proposer une adresse",
  empty: {
    title: "Aucune adresse référencée",
    text: "Les bonnes adresses de la communauté apparaîtront ici une fois vérifiées."
  }
};

export default function Page({ searchParams }: { searchParams: SectionSearch }) {
  return <SectionListPage config={CONFIG} searchParams={searchParams} />;
}

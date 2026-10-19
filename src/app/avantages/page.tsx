import type { Metadata } from "next";
import { SectionListPage, type SectionConfig, type SectionSearch } from "@/components/site/section-page";

export const metadata: Metadata = { title: "Avantages & réductions" };

const CONFIG: SectionConfig = {
  section: "/avantages",
  pre: "Avantages &",
  em: "réductions",
  desc: "Les offres négociées pour la communauté auprès de partenaires, réservées aux membres.",
  types: [
    "DEAL"
  ],
  placeholder: "Partenaire, avantage…",
  publishLabel: "Proposer un partenariat",
  empty: {
    title: "Aucun avantage pour l'instant",
    text: "Les offres partenaires seront publiées ici dès les premiers accords signés."
  },
  cols: 2
};

export default function Page({ searchParams }: { searchParams: SectionSearch }) {
  return <SectionListPage config={CONFIG} searchParams={searchParams} />;
}

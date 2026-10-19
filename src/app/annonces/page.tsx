import type { Metadata } from "next";
import { SectionListPage, type SectionConfig, type SectionSearch } from "@/components/site/section-page";

export const metadata: Metadata = { title: "Petites annonces" };

const CONFIG: SectionConfig = {
  section: "/annonces",
  pre: "Petites",
  em: "annonces",
  desc: "Entre membres : bonnes affaires, logement, covoiturage, services. Dépôt gratuit, réponse réservée aux inscrits.",
  types: [
    "CLASSIFIED"
  ],
  placeholder: "Objet, ville…",
  categoriesFrom: "CLASSIFIED",
  publishLabel: "Déposer une annonce",
  empty: {
    title: "Aucune annonce en ligne",
    text: "Les petites annonces des membres apparaîtront ici."
  }
};

export default function Page({ searchParams }: { searchParams: SectionSearch }) {
  return <SectionListPage config={CONFIG} searchParams={searchParams} />;
}

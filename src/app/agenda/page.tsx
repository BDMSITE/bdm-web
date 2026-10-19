import type { Metadata } from "next";
import { SectionListPage, type SectionConfig, type SectionSearch } from "@/components/site/section-page";

export const metadata: Metadata = { title: "Les événements à venir" };

const CONFIG: SectionConfig = {
  section: "/agenda",
  pre: "Les événements",
  em: "à venir",
  desc: "Soirées, concerts, conférences, pique-niques de la diaspora béninoise, publiés par les associations, les artistes et les membres.",
  types: [
    "EVENT"
  ],
  placeholder: "Événement, ville…",
  categoriesFrom: "EVENT",
  upcoming: true,
  publishLabel: "Annoncer un événement",
  empty: {
    title: "Aucun événement annoncé",
    text: "Les prochains rendez-vous de la communauté s'afficheront ici."
  }
};

export default function Page({ searchParams }: { searchParams: SectionSearch }) {
  return <SectionListPage config={CONFIG} searchParams={searchParams} />;
}

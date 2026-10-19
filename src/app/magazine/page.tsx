import type { Metadata } from "next";
import { SectionListPage, type SectionConfig, type SectionSearch } from "@/components/site/section-page";

export const metadata: Metadata = { title: "Le magazine" };

const CONFIG: SectionConfig = {
  section: "/magazine",
  pre: "Le",
  em: "magazine",
  desc: "Actualités, portraits, parcours de retour au pays et articles publiés par les membres, relus par la rédaction.",
  types: [
    "ARTICLE",
    "MEMBER_ARTICLE"
  ],
  placeholder: "Sujet, personne, ville…",
  publishLabel: "Proposer un article",
  empty: {
    title: "Les premiers articles arrivent",
    text: "La rédaction prépare les premiers contenus. Vous pouvez déjà proposer un article."
  }
};

export default function Page({ searchParams }: { searchParams: SectionSearch }) {
  return <SectionListPage config={CONFIG} searchParams={searchParams} />;
}

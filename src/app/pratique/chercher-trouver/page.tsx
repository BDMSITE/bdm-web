import type { Metadata } from "next";
import { SectionListPage, type SectionConfig, type SectionSearch } from "@/components/site/section-page";

export const metadata: Metadata = { title: "Chercher / trouver" };

const CONFIG: SectionConfig = {
  section: "/pratique/chercher-trouver",
  pre: "Chercher /",
  em: "trouver",
  desc: "Demandes d'entraide et mises en relation entre membres : un contact, un partenaire, un service, un conseil.",
  types: [
    "HELP_REQUEST"
  ],
  placeholder: "Que cherchez-vous ?",
  publishLabel: "Publier une demande",
  empty: {
    title: "Aucune demande en cours",
    text: "Les demandes de mise en relation apparaîtront ici."
  },
  cols: 2
};

export default function Page({ searchParams }: { searchParams: SectionSearch }) {
  return <SectionListPage config={CONFIG} searchParams={searchParams} />;
}

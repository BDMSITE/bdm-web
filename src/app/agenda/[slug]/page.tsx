import type { Metadata } from "next";
import { ContentDetailPage, contentMetadata } from "@/components/site/section-page";

type Props = { params: Promise<{ slug: string }> };
const TYPES = ["EVENT"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return contentMetadata((await params).slug, "Les événements à venir");
}

export default async function Page({ params }: Props) {
  return <ContentDetailPage slug={(await params).slug} types={[...TYPES]} />;
}

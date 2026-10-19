import type { Metadata } from "next";
import { ContentDetailPage, contentMetadata } from "@/components/site/section-page";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return contentMetadata((await params).slug, "Lieu de mémoire");
}

export default async function Page({ params }: Props) {
  return <ContentDetailPage slug={(await params).slug} types={["MEMORY_PLACE"]} />;
}

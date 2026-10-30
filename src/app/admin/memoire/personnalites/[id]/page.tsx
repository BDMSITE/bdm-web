import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHead } from "@/components/admin/ui";
import { EditCelebrityForm, type CelebrityFormValues, type CelebrityLink } from "../../form";

export const metadata: Metadata = { title: "Modifier une personnalité" };

/* Édition d'une fiche « Béninois qui comptent » (table Celebrity).
   L'accès est filtré par proxy.ts (rôle rédaction / modération / admin). */

/* Celebrity.links est un Json libre : on ne garde que les entrées { label, url } valides. */
function parseLinks(raw: unknown): CelebrityLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l): l is { label?: unknown; url?: unknown } => typeof l === "object" && l !== null)
    .filter((l) => typeof l.url === "string" && l.url)
    .map((l) => ({ label: typeof l.label === "string" ? l.label : "", url: l.url as string }))
    .slice(0, 3);
}

export default async function AdminEditCelebrityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const celebrity = await db.celebrity.findUnique({ where: { id } });
  if (!celebrity) notFound();

  const values: CelebrityFormValues = {
    name: celebrity.name,
    domain: celebrity.domain ?? "",
    bio: celebrity.bio ?? "",
    photo: celebrity.photo ?? "",
    links: parseLinks(celebrity.links),
  };

  return (
    <>
      <p className="mb-4 text-sm">
        <Link href="/admin/memoire" className="font-bold text-primary hover:underline">← Retour à Mémoire &amp; HCBE</Link>
      </p>
      <PageHead title={celebrity.name} desc={`Personnalité${celebrity.domain ? ` · ${celebrity.domain}` : ""} · adresse : ${celebrity.slug} (inchangée à la modification)`}>
        <Link href="/magazine/beninois-qui-comptent" className="whitespace-nowrap rounded border border-line bg-paper px-4 py-2 text-sm font-bold text-ink-2 hover:border-primary hover:text-primary">
          Page publique
        </Link>
      </PageHead>

      <EditCelebrityForm id={celebrity.id} values={values} />
    </>
  );
}

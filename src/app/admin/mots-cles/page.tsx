import Link from "next/link";
import type { Metadata } from "next";
import type { KeywordFamily } from "@prisma/client";
import { db } from "@/lib/db";
import { keywordHref } from "@/lib/routes";
import { PageHead, StatCard, Card, TableShell, Th, Td, EmptyState, fmtNumber } from "@/components/admin/ui";
import { KeywordForm } from "./keyword-form";

export const metadata: Metadata = { title: "Mots-clés" };

/* Mots-clés : liste par famille avec le nombre de contenus et de profils liés ; ajout. */

const FAMILLES: { family: KeywordFamily; titre: string; desc: string }[] = [
  { family: "SECTOR", titre: "Secteurs", desc: "Métiers et secteurs d'activité (emploi, annuaire)." },
  { family: "PLACE", titre: "Lieux", desc: "Villes, pays, régions." },
  { family: "THEME", titre: "Thèmes", desc: "Sujets transversaux (retour au pays, culture, afrodescendants…)." },
];

export default async function AdminMotsClesPage() {
  const keywords = await db.keyword.findMany({
    orderBy: [{ family: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, family: true, _count: { select: { contents: true, profiles: true } } },
  });

  const parFamille = (f: KeywordFamily) => keywords.filter((k) => k.family === f);

  return (
    <>
      <PageHead title="Mots-clés" desc="Chaque contenu et chaque profil est tagué par des mots-clés ; ils alimentent les filtres, la carte et les alertes.">
        <KeywordForm />
      </PageHead>

      <div className="grid gap-4 sm:grid-cols-3">
        {FAMILLES.map((f) => (
          <StatCard key={f.family} label={f.titre} value={fmtNumber(parFamille(f.family).length)} hint={f.desc} />
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {FAMILLES.map((f) => {
          const rows = parFamille(f.family);
          return (
            <Card key={f.family} title={`${f.titre} (${rows.length})`}>
              {rows.length === 0 ? (
                <EmptyState title={`Aucun mot-clé dans la famille « ${f.titre} ».`}>Ajoutez-en un avec le formulaire ci-dessus.</EmptyState>
              ) : (
                <TableShell head={<><Th>Mot-clé</Th><Th>Adresse</Th><Th>Contenus</Th><Th>Profils</Th></>}>
                  {rows.map((k) => (
                    <tr key={k.id} className="hover:bg-primary-faint">
                      <Td className="font-semibold">
                        <Link href={keywordHref(k.slug)} className="hover:text-primary hover:underline">{k.name}</Link>
                      </Td>
                      <Td className="text-muted">{keywordHref(k.slug)}</Td>
                      <Td className="tabular-nums text-ink-2">{fmtNumber(k._count.contents)}</Td>
                      <Td className="tabular-nums text-ink-2">{fmtNumber(k._count.profiles)}</Td>
                    </tr>
                  ))}
                </TableShell>
              )}
            </Card>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted">
        Les mots-clés saisis par les membres sur leur profil sont créés automatiquement dans la famille « Thèmes ». Renommer, fusionner ou supprimer un mot-clé n&apos;est pas encore possible depuis cette page.
      </p>
    </>
  );
}

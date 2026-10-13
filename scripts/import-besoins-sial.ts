import "dotenv/config";
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { slugify } from "../src/lib/slug";

/* Import de la synthèse « besoins des entreprises » (SIAL Paris 2026) →
   une demande de mise en relation (contenu HELP_REQUEST, rubrique
   Chercher / trouver) par entreprise. Relançable : une entreprise déjà
   importée (même slug) est mise à jour, pas dupliquée.

   Usage : pnpm import:sial <fichier.xlsx> [--go] */

const COLS = {
  entreprise: "Entreprise",
  offre: "Offre / produits exposés",
  prioritaire: "Produit / offre prioritaire",
  atouts: "Atouts / certifications déclarés",
  partenaires: "Profils de partenaires recherchés",
  marches: "Marchés cibles",
  cibles: "Entreprises / cibles nommément citées",
  besoins: "Besoins exprimés / objectif de mise en relation",
};

const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const liste = (s: string) => s.split(/\s*;\s*/).map((x) => x.trim()).filter((x) => x && !/^(aucun|non pr[eé]cis)/i.test(x));
// « GROUPE TILLOU – Les Jus Tillou SA & … » → « GROUPE TILLOU » pour le titre
const nomCourt = (s: string) => s.split(/\s+[–\-/]\s+/)[0].trim();

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) throw new Error("Usage : pnpm import:sial <fichier.xlsx> [--go]");
  const go = args.includes("--go");

  const wb = XLSX.read(readFileSync(file), { type: "buffer" });
  const ws = wb.Sheets["Besoins entreprises"] ?? wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", blankrows: false });
  const hi = raw.findIndex((r) => r.some((c) => norm(c) === norm(COLS.entreprise)));
  if (hi < 0) throw new Error("En-tête « Entreprise » introuvable");
  const header = raw[hi].map(norm);
  const col = (name: string) => header.indexOf(norm(name));
  const rows = raw.slice(hi + 1).filter((r) => String(r[col(COLS.entreprise)] ?? "").trim());
  console.log(`${rows.length} entreprises lues`);

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const get = (r: unknown[], k: keyof typeof COLS) => String(r[col(COLS[k])] ?? "").trim();
  let crees = 0, maj = 0;

  for (const r of rows) {
    const entreprise = get(r, "entreprise");
    const partenaires = liste(get(r, "partenaires"));
    const marches = liste(get(r, "marches"));
    const title = `${nomCourt(entreprise)} recherche ${partenaires.slice(0, 2).join(", ").toLowerCase() || "des partenaires"}`;
    const slug = `sial-2026-${slugify(entreprise)}`;
    const excerpt = `${get(r, "prioritaire")} — ${get(r, "besoins")}`.slice(0, 280);
    const body = [
      `**Entreprise** : ${entreprise}`,
      `**Offre / produits** : ${get(r, "offre")}`,
      `**Produit prioritaire** : ${get(r, "prioritaire")}`,
      `**Atouts et certifications** : ${get(r, "atouts")}`,
      `**Partenaires recherchés** : ${partenaires.join(", ") || "—"}`,
      `**Marchés cibles** : ${marches.join(", ") || "—"}`,
      `**Cibles citées** : ${get(r, "cibles")}`,
      `**Besoins / objectif de mise en relation** : ${get(r, "besoins")}`,
      "",
      "_Source : synthèse des besoins des entreprises béninoises, SIAL Paris 2026 (HCBE). Mise en relation par formulaire relais._",
    ].join("\n\n");

    const keywords = [
      { name: "Entrepreneuriat", family: "THEME" as const },
      { name: "Agroalimentaire", family: "SECTOR" as const },
      { name: "SIAL Paris 2026", family: "THEME" as const },
      ...marches.map((m) => ({ name: m.replace(/\s*\(.*\)$/, ""), family: "PLACE" as const })),
    ];
    const kw = keywords.map((k) => ({
      keyword: { connectOrCreate: { where: { slug: slugify(k.name) }, create: { name: k.name, slug: slugify(k.name), family: k.family } } },
    }));

    console.log(`  ${entreprise} → « ${title} » · ${marches.join(", ")}`);
    if (!go) continue;

    const existing = await db.content.findUnique({ where: { slug }, select: { id: true } });
    const data = { type: "HELP_REQUEST" as const, title, excerpt, body, country: "Bénin", city: "Cotonou", lat: 6.37, lng: 2.39, status: "PUBLISHED" as const, publishedAt: new Date() };
    if (existing) {
      await db.content.update({ where: { id: existing.id }, data: { ...data, keywords: { deleteMany: {}, create: kw } } });
      maj++;
    } else {
      await db.content.create({ data: { ...data, slug, keywords: { create: kw } } });
      crees++;
    }
  }

  console.log(go ? `\nCréés : ${crees} · mis à jour : ${maj}` : "\nSimulation — relancer avec --go pour écrire en base.");
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

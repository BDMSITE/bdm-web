import "dotenv/config";
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { PrismaClient, type AccountType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { slugify } from "../src/lib/slug";

/* Import de la base Excel/CSV des membres (HCBE) → un compte PENDING_EMAIL +
   un profil par ligne. Les invitations (lien d'activation) partent ensuite
   depuis l'admin, par lots, pour respecter le quota e-mail.

   Usage :
     pnpm import:membres <fichier.xlsx|csv> [--sheet "Nom"] [--source excel-hcbe-2026-10] [--go]
   Sans --go : simulation (rien n'est écrit), avec le rapport des lignes
   ignorées (e-mail absent/invalide, doublon). */

// Mapping colonnes → champs. Clés = intitulés tels qu'écrits dans l'en-tête du
// fichier (insensible à la casse et aux accents). À ajuster au premier passage.
const COLONNES: Record<string, string[]> = {
  email: ["email", "e-mail", "mail", "adresse email", "courriel"],
  prenom: ["prenom", "prénom", "first name"],
  nom: ["nom", "nom de famille", "last name"],
  ville: ["ville", "city", "ville de residence"],
  pays: ["pays", "country", "pays de residence"],
  secteur: ["secteur", "profession", "metier", "métier", "domaine", "activite"],
  telephone: ["telephone", "téléphone", "tel", "phone"],
  type: ["type", "type de compte", "categorie", "catégorie"],
};

const TYPE_MAP: Record<string, AccountType> = {
  entreprise: "COMPANY", societe: "COMPANY", company: "COMPANY",
  association: "ASSOCIATION", asso: "ASSOCIATION", ong: "ASSOCIATION",
  artiste: "ARTIST", groupe: "ARTIST", artist: "ARTIST",
};

const norm = (s: unknown) =>
  String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function lireFichier(path: string, sheet?: string): Record<string, unknown>[] {
  const wb = XLSX.read(readFileSync(path), { type: "buffer" });
  const name = sheet ?? wb.SheetNames[0];
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Feuille introuvable : ${name} (feuilles : ${wb.SheetNames.join(", ")})`);
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
}

function mapper(row: Record<string, unknown>) {
  const byNorm = new Map(Object.keys(row).map((k) => [norm(k), row[k]]));
  const get = (champ: string) => {
    for (const alias of COLONNES[champ]) {
      const v = byNorm.get(norm(alias));
      if (v !== undefined && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };
  return {
    email: get("email").toLowerCase(),
    prenom: get("prenom"),
    nom: get("nom"),
    ville: get("ville"),
    pays: get("pays"),
    secteur: get("secteur"),
    telephone: get("telephone"),
    type: TYPE_MAP[norm(get("type"))] ?? ("MEMBER" as AccountType),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) throw new Error("Fichier manquant. Usage : pnpm import:membres <fichier> [--go]");
  const go = args.includes("--go");
  const sheet = args.includes("--sheet") ? args[args.indexOf("--sheet") + 1] : undefined;
  const source = args.includes("--source") ? args[args.indexOf("--source") + 1] : `import-${new Date().toISOString().slice(0, 10)}`;

  const rows = lireFichier(file, sheet);
  console.log(`${rows.length} lignes lues · colonnes : ${Object.keys(rows[0] ?? {}).join(" | ")}`);

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const existants = new Set((await db.user.findMany({ select: { email: true } })).map((u) => u.email));
  const vus = new Set<string>();
  const ignorees: { ligne: number; raison: string; email: string }[] = [];
  let crees = 0;

  for (const [i, row] of rows.entries()) {
    const ligne = i + 2;
    const m = mapper(row);
    if (!m.email || !EMAIL_RE.test(m.email)) { ignorees.push({ ligne, raison: "e-mail absent ou invalide", email: m.email }); continue; }
    if (vus.has(m.email)) { ignorees.push({ ligne, raison: "doublon dans le fichier", email: m.email }); continue; }
    vus.add(m.email);
    if (existants.has(m.email)) { ignorees.push({ ligne, raison: "compte déjà existant", email: m.email }); continue; }

    const displayName = m.type === "MEMBER" && m.nom ? `${m.prenom} ${m.nom.charAt(0)}.`.trim() : `${m.prenom} ${m.nom}`.trim() || m.email.split("@")[0];
    const base = slugify(displayName) || "membre";
    crees++;
    if (!go) continue;

    const taken = await db.profile.count({ where: { slug: { startsWith: base } } });
    await db.user.create({
      data: {
        email: m.email,
        name: `${m.prenom} ${m.nom}`.trim() || null,
        accountType: m.type,
        status: "PENDING_EMAIL",
        importedFrom: source,
        profile: {
          create: {
            displayName,
            slug: taken ? `${base}-${taken + 1}` : base,
            city: m.ville || null,
            country: m.pays || null,
            visibility: { directory: true },
            ...(m.secteur && {
              keywords: {
                create: [{ keyword: { connectOrCreate: { where: { slug: slugify(m.secteur) }, create: { name: m.secteur, slug: slugify(m.secteur), family: "SECTOR" } } } }],
              },
            }),
          },
        },
      },
    });
  }

  console.log(`\n${go ? "Créés" : "À créer (simulation)"} : ${crees} · ignorées : ${ignorees.length}`);
  for (const r of ignorees) console.log(`  ligne ${r.ligne} — ${r.raison}${r.email ? ` (${r.email})` : ""}`);
  if (!go) console.log("\nRelancer avec --go pour écrire en base.");
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

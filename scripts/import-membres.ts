import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { PrismaClient, type AccountType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { slugify } from "../src/lib/slug";

/* Import de la base Excel/CSV des contacts (HCBE).
   - Mode comptes (défaut) : un compte PENDING_EMAIL + un profil par ligne avec
     e-mail ; les invitations partent ensuite depuis /admin/imports.
   - Mode abonnés (--as subscribers --segment presse) : pas de compte, un
     abonné newsletter par e-mail, étiqueté par segment.

   Usage :
     pnpm import:membres <fichier> [--sheet "nom"] [--source excel-hcbe-2020] [--as subscribers --segment presse] [--go]
   Sans --go : simulation + rapport des lignes ignorées (rapport-import.csv). */

const COLONNES: Record<string, string[]> = {
  email: ["email", "e-mail", "mail", "adresse mail", "adresse e-mail", "courriel"],
  prenom: ["prenom", "prénom", "prenoms", "prénoms", "first name"],
  nom: ["nom", "nom de famille", "last name"],
  ville: ["ville", "city", "ville de residence"],
  pays: ["pays", "country", "pays de residence"],
  fonction: ["fonction", "profession", "metier", "métier", "poste", "titre"],
  secteur: ["secteur", "domaine", "activite", "activité"],
  telephone: ["telephone", "téléphone", "numero de telephone", "tel", "phone", "portable"],
  type: ["type", "type de compte", "categorie", "catégorie"],
};

const TYPE_MAP: Record<string, AccountType> = {
  entreprise: "COMPANY", societe: "COMPANY", company: "COMPANY",
  association: "ASSOCIATION", asso: "ASSOCIATION", ong: "ASSOCIATION",
  artiste: "ARTIST", groupe: "ARTIST", artist: "ARTIST",
};

// Pays : [libellé canonique, motifs reconnus dans la saisie libre]
const PAYS: [string, RegExp][] = [
  ["Bénin", /\bb[eé]nin\b/],
  ["Côte d'Ivoire", /c[oô]te\s*d['’(]?\s*ivoire|\brci\b|abidjan/],
  ["Sénégal", /s[eé]n[eé]gal|dakar/],
  ["Togo", /\btogo\b|lom[eé]/],
  ["Ghana", /ghana|accra/],
  ["Gabon", /gabon|libreville/],
  ["Congo", /congo/],
  ["Afrique du Sud", /afrique\s*d[eu]\s*sud|johannesb/],
  ["Canada", /canada|montr[eé]al|qu[eé]bec|laval/],
  ["États-Unis", /\busa\b|etats[- ]unis|floride|atlanta|austin|washington|raleigh|tampa/],
  ["Brésil", /br[eé]sil|belo horizonte/],
  ["Belgique", /belgique|bruxel|namur/],
  ["Suisse", /suisse/],
  ["Allemagne", /allema/],
  ["Italie", /italie|rome/],
  ["Espagne", /espagne/],
  ["Royaume-Uni", /royaume[- ]uni|londres|uk\b/],
  ["Pays-Bas", /pays[- ]bas|rotterd|utrecht/],
  ["Hongrie", /hongrie|budapest/],
  ["Russie", /russie|petersb/],
  ["Norvège", /norv[eè]ge/],
  ["Singapour", /singapour/],
  ["Japon", /japon/],
  ["Chine", /chine/],
  ["France", /fra?nce|frnace|mayotte|paris|idf|parisien|lyon|marseille|lille|bordeaux|rouen|rennes|orl[eé]ans|montpellier|toulouse|nantes|nice/],
];
const VILLES: [string, RegExp][] = [
  ["Paris", /paris|idf|parisien|r[eé]gion\s*par/], ["Lyon", /lyon/], ["Marseille", /marseille/], ["Lille", /lille/],
  ["Bordeaux", /bordeaux/], ["Rouen", /rouen/], ["Rennes", /rennes/], ["Orléans", /orl[eé]ans/], ["Montpellier", /montpellier/],
  ["Toulouse", /toulouse/], ["Nantes", /nantes/], ["Nice", /\bnice\b/], ["Besançon", /besan/], ["Montréal", /montr[eé]al/],
  ["Québec", /qu[eé]bec/], ["Bruxelles", /bruxel/], ["Namur", /namur/], ["Abidjan", /abidjan/], ["Dakar", /dakar/],
  ["Libreville", /libreville/], ["Cotonou", /cotonou/], ["Lomé", /lom[eé]/], ["Londres", /londres/], ["Rome", /\brome\b/],
  ["Budapest", /budapest/], ["Atlanta", /atlanta/], ["Austin", /austin/], ["Washington", /washington/], ["Tampa", /tampa/],
  ["Rotterdam", /rotterd/], ["Johannesburg", /johannesb/], ["Belo Horizonte", /belo horizonte/], ["Mayotte", /mayotte/],
];

const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const EMAIL_RE = /[^\s@,;:<>"'()]+@[^\s@,;:<>"'()]+\.[a-z]{2,}/i;
const titleCase = (s: string) =>
  s.trim().toLowerCase().replace(/(^|[\s'-])([a-zà-ÿ])/g, (m, sep, c) => sep + c.toUpperCase());

function lieu(raw: string) {
  const n = norm(raw);
  const country = PAYS.find(([, re]) => re.test(n))?.[0] ?? null;
  const city = VILLES.find(([, re]) => re.test(n))?.[0] ?? null;
  return { country, city };
}

function lireFichier(path: string, sheet?: string) {
  const wb = XLSX.read(readFileSync(path), { type: "buffer" });
  const name = sheet ? wb.SheetNames.find((s) => norm(s).includes(norm(sheet))) : wb.SheetNames[0];
  if (!name) throw new Error(`Feuille introuvable : ${sheet} (feuilles : ${wb.SheetNames.join(", ")})`);
  return { name, rows: XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name], { defval: "" }) };
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
  const emailCell = get("email");
  const email = (emailCell.match(EMAIL_RE)?.[0] ?? "").toLowerCase();
  const prenoms = get("prenom");
  const villeRaw = get("ville");
  const paysRaw = get("pays");
  const parsed = lieu(`${villeRaw} ${paysRaw}`);
  return {
    email,
    prenom: titleCase(prenoms.split(/[\s/]+/)[0] ?? ""),
    prenoms: titleCase(prenoms),
    nom: titleCase(get("nom")),
    city: villeRaw && !/\s-\s|\(/.test(villeRaw) ? titleCase(villeRaw) : parsed.city,
    country: parsed.country,
    lieuRaw: `${villeRaw} ${paysRaw}`.trim(),
    headline: get("fonction").slice(0, 120),
    secteur: get("secteur"),
    phone: get("telephone").replace(/[^\d+\s./-]/g, "").trim().slice(0, 40) || null,
    type: TYPE_MAP[norm(get("type"))] ?? ("MEMBER" as AccountType),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) throw new Error("Fichier manquant. Usage : pnpm import:membres <fichier> [--go]");
  const opt = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
  const go = args.includes("--go");
  const asSubscribers = opt("--as") === "subscribers";
  const segment = opt("--segment") ?? "import";
  const source = opt("--source") ?? `import-${new Date().toISOString().slice(0, 10)}`;

  const { name, rows } = lireFichier(file, opt("--sheet"));
  console.log(`Feuille « ${name} » : ${rows.length} lignes · colonnes : ${Object.keys(rows[0] ?? {}).map((k) => k.trim()).filter(Boolean).join(" | ")}`);

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const existants = new Set((await db.user.findMany({ select: { email: true } })).map((u) => u.email));
  const vus = new Set<string>();
  const ignorees: { ligne: number; raison: string; nom: string }[] = [];
  const stats = { crees: 0, sansPays: 0 };

  for (const [i, row] of rows.entries()) {
    const ligne = i + 2;
    const m = mapper(row);
    const nomComplet = `${m.prenoms} ${m.nom}`.trim();
    if (!m.email) { ignorees.push({ ligne, raison: "e-mail absent ou illisible", nom: nomComplet }); continue; }
    if (vus.has(m.email)) { ignorees.push({ ligne, raison: "doublon dans le fichier", nom: nomComplet }); continue; }
    vus.add(m.email);

    if (asSubscribers) {
      stats.crees++;
      if (go) {
        const prev = await db.subscriber.findUnique({ where: { email: m.email }, select: { segments: true } });
        const segs = new Set([...((prev?.segments as string[] | null) ?? []), segment]);
        await db.subscriber.upsert({ where: { email: m.email }, update: { segments: [...segs] }, create: { email: m.email, segments: [segment] } });
      }
      continue;
    }

    if (existants.has(m.email)) { ignorees.push({ ligne, raison: "compte déjà existant", nom: nomComplet }); continue; }
    if (!m.country) stats.sansPays++;
    const displayName = m.type === "MEMBER" && m.nom ? `${m.prenom} ${m.nom.charAt(0)}.`.trim() : nomComplet || m.email.split("@")[0];
    const base = slugify(displayName) || "membre";
    stats.crees++;
    if (!go) continue;

    const taken = await db.profile.count({ where: { slug: { startsWith: base } } });
    await db.user.create({
      data: {
        email: m.email,
        name: nomComplet || null,
        accountType: m.type,
        status: "PENDING_EMAIL",
        importedFrom: source,
        profile: {
          create: {
            displayName,
            slug: taken ? `${base}-${taken + 1}` : base,
            headline: m.headline || null,
            phone: m.phone,
            city: m.city,
            country: m.country,
            visibility: { directory: true },
            ...(m.secteur && {
              keywords: { create: [{ keyword: { connectOrCreate: { where: { slug: slugify(m.secteur) }, create: { name: m.secteur, slug: slugify(m.secteur), family: "SECTOR" } } } }] },
            }),
          },
        },
      },
    });
  }

  const quoi = asSubscribers ? `abonnés « ${segment} »` : "comptes";
  console.log(`\n${go ? "Créés" : "À créer (simulation)"} : ${stats.crees} ${quoi} · ignorées : ${ignorees.length}${asSubscribers ? "" : ` · sans pays reconnu : ${stats.sansPays}`}`);
  const parRaison = new Map<string, number>();
  ignorees.forEach((r) => parRaison.set(r.raison, (parRaison.get(r.raison) ?? 0) + 1));
  for (const [raison, n] of parRaison) console.log(`  ${n} × ${raison}`);
  if (ignorees.length) {
    const out = `rapport-import-${slugify(name)}.csv`;
    writeFileSync(out, "ligne;raison;nom\n" + ignorees.map((r) => `${r.ligne};${r.raison};${r.nom}`).join("\n"));
    console.log(`  détail → ${out} (à corriger dans l'Excel, puis relancer)`);
  }
  if (!go) console.log("\nRelancer avec --go pour écrire en base.");
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

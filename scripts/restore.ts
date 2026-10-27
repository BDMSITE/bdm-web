/* Restaure la base depuis une sauvegarde JSON. TOUT le contenu actuel est remplacé.
   Usage :
     pnpm db:restore --file backups/bdm-….json --yes        → base de DATABASE_URL (.env)
     DATABASE_URL=… pnpm db:restore --latest --yes           → dernière sauvegarde du Blob (BLOB_READ_WRITE_TOKEN requis)
   Sans --yes : affiche seulement ce qui serait fait. */
import { writeFileSync, mkdirSync } from "node:fs";
import { list } from "@vercel/blob";
import { loadDump, restoreDatabase, insertionOrder } from "../src/lib/restore";

const args = process.argv.slice(2);
const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const yes = args.includes("--yes");

async function fetchLatest(): Promise<string> {
  const { blobs } = await list({ prefix: "sauvegardes/", limit: 1000 });
  const last = blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
  if (!last) throw new Error("Aucune sauvegarde dans le Blob.");
  const { get } = await import("@vercel/blob");
  const r = await get(last.pathname, { access: "private", useCache: false });
  if (!r || r.statusCode !== 200) throw new Error("Téléchargement impossible : " + (r?.statusCode ?? "aucune réponse"));
  mkdirSync("backups", { recursive: true });
  const file = `backups/${last.pathname.split("/").pop()}`;
  writeFileSync(file, Buffer.from(await new Response(r.stream).arrayBuffer()));
  console.log(`Téléchargée : ${last.pathname} (${Math.round(last.size / 1024)} Ko) → ${file}`);
  return file;
}

async function main() {
  const file = args.includes("--latest") ? await fetchLatest() : opt("--file");
  if (!file) { console.error("Indiquez --file <sauvegarde.json> ou --latest"); process.exit(1); }
  const dump = loadDump(file);
  const total = Object.values(dump.models).reduce((n, r) => n + r.length, 0);
  console.log(`Sauvegarde du ${dump.createdAt} : ${total} lignes.`);
  console.log("Ordre d'insertion :", insertionOrder().join(" → "));
  const cible = (process.env.DATABASE_URL ?? "").replace(/\/\/[^@]*@/, "//…@");
  console.log(`Base cible : ${cible}`);
  if (!yes) { console.log("\nAjoutez --yes pour remplacer TOUT le contenu de cette base par la sauvegarde."); return; }
  await restoreDatabase(dump, (s) => console.log("  " + s));
  console.log("Restauration terminée.");
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

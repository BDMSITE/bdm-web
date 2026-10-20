/* Sauvegarde manuelle de la base vers ./backups (gitignoré).
   Usage : pnpm db:backup            → base de DATABASE_URL (.env)
           DATABASE_URL=... pnpm db:backup   → une autre base (ex. Neon) */
import { mkdirSync, writeFileSync } from "node:fs";
import { dumpDatabase } from "../src/lib/backup";

async function main() {
  const dump = await dumpDatabase();
  mkdirSync("backups", { recursive: true });
  const file = `backups/bdm-${dump.createdAt.replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(dump, null, 1));
  const rows = Object.entries(dump.models).map(([m, r]) => `${m}: ${r.length}`).join(", ");
  console.log(`Sauvegarde écrite : ${file}\n${rows}`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

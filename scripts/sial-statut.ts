/* Publie ou masque d'un coup les 10 besoins SIAL Paris 2026 (HELP_REQUEST, slug sial-2026-*).
   Usage : pnpm sial:statut --publier | --masquer   (DATABASE_URL=… pour viser Neon) */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const publier = process.argv.includes("--publier");
if (!publier && !process.argv.includes("--masquer")) {
  console.error("Indiquez --publier ou --masquer");
  process.exit(1);
}

async function main() {
  const where = { type: "HELP_REQUEST" as const, slug: { startsWith: "sial-2026-" } };
  const r = publier
    ? await db.content.updateMany({ where: { ...where, status: { not: "PUBLISHED" } }, data: { status: "PUBLISHED", publishedAt: new Date() } })
    : await db.content.updateMany({ where: { ...where, status: "PUBLISHED" }, data: { status: "IN_MODERATION" } });
  const n = await db.content.count({ where: { ...where, status: "PUBLISHED" } });
  console.log(`${publier ? "publiés" : "masqués"} : ${r.count} — besoins SIAL en ligne : ${n}`);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

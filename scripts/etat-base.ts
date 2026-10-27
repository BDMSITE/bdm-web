/* Photographie de la base (DATABASE_URL=… pour viser Neon) : comptes, contenus, régie. */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
async function main() {
  const users = await db.user.groupBy({ by: ["status", "importedFrom"], _count: true, orderBy: { status: "asc" } });
  console.log("Comptes :", users.map((u) => `${u.status}${u.importedFrom ? ` (${u.importedFrom})` : ""} = ${u._count}`).join(" · "));
  const [geo, profils, abonnes, bannieres, partenaires, celebs, mots] = await Promise.all([
    db.profile.count({ where: { lat: { not: null } } }), db.profile.count(), db.subscriber.count(), db.banner.count(), db.partner.count(), db.celebrity.count(), db.keyword.count(),
  ]);
  console.log(`Profils : ${profils} (géolocalisés : ${geo}) · Abonnés newsletter : ${abonnes} · Bannières : ${bannieres} · Partenaires : ${partenaires} · Personnalités : ${celebs} · Mots-clés : ${mots}`);
  const contents = await db.content.groupBy({ by: ["type", "status"], _count: true, orderBy: { type: "asc" } });
  console.log("Contenus :", contents.map((c) => `${c.type}/${c.status} = ${c._count}`).join(" · "));
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

/* Supprime définitivement des comptes de test (sans contenu) : pnpm tsx scripts/supprimer-comptes-test.ts a@b.test c@d.test */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
async function main() {
  const emails = process.argv.slice(2);
  for (const email of emails) {
    const u = await db.user.findUnique({ where: { email }, select: { id: true, profile: { select: { id: true } } } });
    if (!u) { console.log(`${email} : absent`); continue; }
    const contents = u.profile ? await db.content.count({ where: { ownerProfileId: u.profile.id } }) : 0;
    if (contents) { console.log(`${email} : ${contents} contenu(s), non supprimé`); continue; }
    await db.auditLog.deleteMany({ where: { userId: u.id } });
    await db.user.delete({ where: { id: u.id } });
    console.log(`${email} : supprimé`);
  }
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

/* Crée (ou promeut) un compte administrateur réel, activé, avec un mot de passe généré.
   Usage : DATABASE_URL=… pnpm tsx scripts/creer-admin.ts <email> "<Nom affiché>" <ville> <pays>
   Le mot de passe est écrit sur la sortie standard UNE fois : à ranger dans un coffre, jamais dans le dépôt. */
import { randomBytes } from "node:crypto";
import { hash } from "argon2";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { slugify } from "../src/lib/slug";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const [email, displayName = "Administrateur", city = "Cotonou", country = "Bénin"] = process.argv.slice(2);
if (!email) { console.error("Indiquez l'e-mail"); process.exit(1); }

async function main() {
  const password = randomBytes(12).toString("base64url");
  const passwordHash = await hash(password);
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
  if (existing) {
    await db.user.update({ where: { id: existing.id }, data: { role: "ADMIN", status: "ACTIVE", passwordHash, emailVerified: new Date() } });
    console.log(`${email} : compte existant promu administrateur, mot de passe réinitialisé`);
  } else {
    let slug = slugify(displayName) || "admin";
    for (let i = 2; await db.profile.findUnique({ where: { slug } }); i++) slug = `${slugify(displayName)}-${i}`;
    await db.user.create({
      data: {
        email: email.toLowerCase(), name: displayName, role: "ADMIN", status: "ACTIVE", accountType: "MEMBER", passwordHash, emailVerified: new Date(),
        profile: { create: { displayName, slug, city, country, visibility: { directory: false } } },
      },
    });
    console.log(`${email} : compte administrateur créé (profil hors annuaire)`);
  }
  console.log(`MOT_DE_PASSE=${password}`);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

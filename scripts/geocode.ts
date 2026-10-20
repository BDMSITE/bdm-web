import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { geocode } from "../src/lib/geocode";

/* Rattrapage : positionne les profils et contenus qui ont une ville mais pas
   de coordonnées. Une requête Nominatim par couple ville/pays distinct, 1/s.
   Usage : pnpm geocode */

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const [profils, contenus] = await Promise.all([
    db.profile.findMany({ where: { lat: null, city: { not: null } }, select: { id: true, city: true, country: true } }),
    db.content.findMany({ where: { lat: null, city: { not: null } }, select: { id: true, city: true, country: true } }),
  ]);
  const cache = new Map<string, { lat: number; lng: number } | null>();
  let ok = 0, ko = 0;
  const resolve = async (city: string | null, country: string | null) => {
    const k = `${city}|${country}`.toLowerCase();
    if (!cache.has(k)) { cache.set(k, await geocode(city, country)); await sleep(1100); }
    return cache.get(k) ?? null;
  };
  for (const p of profils) {
    const g = await resolve(p.city, p.country);
    if (g) { await db.profile.update({ where: { id: p.id }, data: g }); ok++; } else ko++;
  }
  for (const c of contenus) {
    const g = await resolve(c.city, c.country);
    if (g) { await db.content.update({ where: { id: c.id }, data: g }); ok++; } else ko++;
  }
  console.log(`Géocodés : ${ok} · sans résultat : ${ko} · villes distinctes interrogées : ${cache.size}`);
  await db.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });

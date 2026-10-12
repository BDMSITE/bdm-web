import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/* Client Prisma unique (singleton) — Prisma 7 passe par l'adaptateur pg.
   En dev, Next recharge les modules : on garde l'instance sur globalThis
   pour ne pas ouvrir une connexion à chaque rechargement. */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

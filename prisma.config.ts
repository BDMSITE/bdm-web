import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` (postinstall, build Vercel) n'a pas besoin de la base :
// une URL de repli évite de casser l'installation quand DATABASE_URL manque.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "./node_modules/.bin/tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://bdm:bdm@localhost:5433/bdm",
  },
});

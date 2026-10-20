import { Prisma } from "@prisma/client";
import { db } from "./db";

/* Sauvegarde logique de la base : chaque modèle Prisma exporté tel quel en
   JSON. Suffisant pour restaurer après une erreur humaine ou une suppression,
   indépendant de l'hébergeur (Neon gratuit n'a que 24 h d'historique). */

export type BackupDump = {
  version: 1;
  createdAt: string;
  models: Record<string, unknown[]>;
};

export async function dumpDatabase(): Promise<BackupDump> {
  const models: Record<string, unknown[]> = {};
  for (const name of Object.values(Prisma.ModelName)) {
    const delegate = (db as unknown as Record<string, { findMany: () => Promise<unknown[]> }>)[
      name.charAt(0).toLowerCase() + name.slice(1)
    ];
    models[name] = await delegate.findMany();
  }
  return { version: 1, createdAt: new Date().toISOString(), models };
}

export function backupFileName(d = new Date()) {
  return `sauvegardes/bdm-${d.toISOString().slice(0, 10)}.json`;
}

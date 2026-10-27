import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import type { BackupDump } from "./backup";

/* Restauration d'une sauvegarde JSON (voir backup.ts). L'ordre d'insertion
   est déduit du schéma Prisma (relations) : les tables référencées d'abord.
   Tout se passe dans une transaction : si une ligne échoue, rien n'est changé. */

type Deps = Record<string, Set<string>>;

/** Dépendances entre modèles, lues dans prisma/schema.prisma (@relation(fields: …)). */
export function modelDependencies(): Deps {
  const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
  const deps: Deps = {};
  let current = "";
  for (const raw of schema.split("\n")) {
    const line = raw.trim();
    const m = line.match(/^model\s+(\w+)\s*\{/);
    if (m) { current = m[1]; deps[current] = new Set(); continue; }
    if (!current) continue;
    if (line === "}") { current = ""; continue; }
    const rel = line.match(/^(\w+)\s+(\w+)\??\s+@relation\([^)]*fields:/);
    if (rel && rel[2] !== current) deps[current].add(rel[2]);
  }
  return deps;
}

/** Ordre topologique : un modèle vient après ceux qu'il référence. */
export function insertionOrder(): string[] {
  const deps = modelDependencies();
  const names = Object.values(Prisma.ModelName) as string[];
  const done: string[] = [];
  const seen = new Set<string>();
  const visit = (n: string, pile: string[]) => {
    if (seen.has(n)) return;
    if (pile.includes(n)) throw new Error(`Cycle de relations : ${[...pile, n].join(" → ")}`);
    for (const d of deps[n] ?? []) visit(d, [...pile, n]);
    seen.add(n); done.push(n);
  };
  for (const n of names) visit(n, []);
  return done;
}

/** Champs d'auto-référence (ex. Message.parentId) : insérer les parents d'abord. */
function selfRefFields(model: string): string[] {
  const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
  const block = schema.split(new RegExp(`^model\\s+${model}\\s*\\{`, "m"))[1]?.split("\n}")[0] ?? "";
  const out: string[] = [];
  for (const line of block.split("\n")) {
    const m = line.trim().match(new RegExp(`^\\w+\\s+${model}\\??\\s+@relation\\([^)]*fields:\\s*\\[(\\w+)\\]`));
    if (m) out.push(m[1]);
  }
  return out;
}

export function loadDump(file: string): BackupDump {
  const dump = JSON.parse(readFileSync(file, "utf8")) as BackupDump;
  if (dump.version !== 1 || typeof dump.models !== "object") throw new Error("Fichier de sauvegarde invalide.");
  return dump;
}

export async function restoreDatabase(dump: BackupDump, log: (s: string) => void = () => {}) {
  const order = insertionOrder();
  const missing = order.filter((m) => !(m in dump.models));
  if (missing.length) log(`Tables absentes de la sauvegarde (laissées vides) : ${missing.join(", ")}`);

  await db.$transaction(
    async (tx) => {
      const t = tx as unknown as Record<string, { deleteMany: (a?: unknown) => Promise<unknown>; createMany: (a: { data: unknown[] }) => Promise<{ count: number }> }>;
      const delegate = (m: string) => t[m.charAt(0).toLowerCase() + m.slice(1)];

      for (const m of [...order].reverse()) await delegate(m).deleteMany({});
      log("Tables vidées.");

      for (const m of order) {
        const rows = (dump.models[m] ?? []) as Record<string, unknown>[];
        if (!rows.length) continue;
        const selfRefs = selfRefFields(m);
        let pending = rows;
        const inserted = new Set<string>();
        let passes = 0;
        while (pending.length) {
          const ready = selfRefs.length
            ? pending.filter((r) => selfRefs.every((f) => r[f] == null || inserted.has(String(r[f]))))
            : pending;
          if (!ready.length) throw new Error(`${m} : références circulaires impossibles à résoudre (${pending.length} lignes)`);
          for (let i = 0; i < ready.length; i += 500) await delegate(m).createMany({ data: ready.slice(i, i + 500) });
          for (const r of ready) inserted.add(String(r.id ?? ""));
          pending = pending.filter((r) => !ready.includes(r));
          if (++passes > 50) throw new Error(`${m} : trop de passes`);
        }
        log(`${m} : ${rows.length} ligne${rows.length > 1 ? "s" : ""}`);
      }
    },
    { maxWait: 30_000, timeout: 600_000 },
  );
}

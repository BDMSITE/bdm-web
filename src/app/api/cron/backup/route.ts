import { NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";
import { dumpDatabase, backupFileName } from "@/lib/backup";
import { purgeRateLimits } from "@/lib/ratelimit";

/* Sauvegarde quotidienne (cron Vercel, voir vercel.json). Vercel appelle cette
   route avec « Authorization: Bearer CRON_SECRET ». Le fichier JSON part dans
   le Blob privé ; on garde les 30 derniers. Au passage, purge des compteurs
   de limitation périmés. */

export const maxDuration = 300;
const KEEP = 30;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dump = await dumpDatabase();
  const body = JSON.stringify(dump);
  const saved = await put(backupFileName(), body, {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  const { blobs } = await list({ prefix: "sauvegardes/", limit: 1000 });
  const old = blobs
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    .slice(KEEP)
    .map((b) => b.pathname);
  if (old.length) await del(old);

  await purgeRateLimits().catch(() => {});

  const rows = Object.values(dump.models).reduce((n, rows) => n + rows.length, 0);
  console.info(`[backup] ${saved.pathname} : ${rows} lignes, ${(body.length / 1024).toFixed(0)} Ko, ${old.length} ancienne(s) supprimée(s)`);
  return NextResponse.json({ ok: true, file: saved.pathname, rows, bytes: body.length, deleted: old.length });
}

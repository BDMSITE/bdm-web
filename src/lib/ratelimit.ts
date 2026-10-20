import { headers } from "next/headers";
import { db } from "./db";

/* Limitation de tentatives sans service externe : un compteur par clé
   (action + IP ou e-mail) dans Postgres, fenêtre glissante simple. */

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "inconnue").split(",")[0].trim();
}

export async function rateLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  const now = new Date();
  const since = new Date(now.getTime() - windowSec * 1000);
  const row = await db.rateLimit.findUnique({ where: { key } });
  if (!row || row.windowStart < since) {
    await db.rateLimit.upsert({ where: { key }, update: { windowStart: now, count: 1 }, create: { key, windowStart: now, count: 1 } });
    return true;
  }
  if (row.count >= max) return false;
  await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}

export async function purgeRateLimits() {
  await db.rateLimit.deleteMany({ where: { windowStart: { lt: new Date(Date.now() - 864e5) } } });
}

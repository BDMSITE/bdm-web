import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/* Lecture d'un CV déposé (Blob privé). Peuvent le voir : son propriétaire,
   la rédaction/modération, un membre connecté si le CV est publié, et le
   recruteur qui a reçu une candidature de ce membre. Jamais de lien direct. */

const STAFF = new Set(["EDITOR", "MODERATOR", "ADMIN"]);

export async function GET(_req: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const [{ profileId }, session] = await Promise.all([params, auth()]);
  if (!session?.user) return new Response("Connexion requise", { status: 401 });
  if (!/^[\w-]+$/.test(profileId)) return new Response("Introuvable", { status: 404 });

  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { userId: true, cvUrl: true, cvPublished: true, displayName: true },
  });
  if (!profile || profile.cvUrl !== `/api/cv/${profileId}`) return new Response("Introuvable", { status: 404 });

  const viewer = session.user;
  let allowed = profile.userId === viewer.id || STAFF.has(viewer.role ?? "") || profile.cvPublished;
  if (!allowed) {
    const candidature = await db.application.findFirst({
      where: { userId: profile.userId, content: { ownerProfile: { userId: viewer.id } } },
      select: { id: true },
    });
    allowed = Boolean(candidature);
  }
  if (!allowed) return new Response("Accès refusé", { status: 403 });

  const result = await get(`cv/${profileId}.pdf`, { access: "private", useCache: false }).catch(() => null);
  if (!result || result.statusCode !== 200) return new Response("Fichier indisponible", { status: 404 });

  const name = `CV-${(profile.displayName ?? "membre").replace(/[^\w-]+/g, "_")}.pdf`;
  return new Response(result.stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

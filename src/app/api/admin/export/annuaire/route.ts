import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";

/* Export CSV de l'annuaire pour le HCBE (administrateurs seulement) : tous les comptes
   actifs avec leur profil. Usage interne : le fichier contient les e-mails. */

const TYPE: Record<string, string> = { MEMBER: "Membre", COMPANY: "Entreprise", ASSOCIATION: "Association", ARTIST: "Artiste" };

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return new Response("Réservé aux administrateurs.", { status: 403 });

  const users = await db.user.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: {
      email: true,
      accountType: true,
      createdAt: true,
      profile: { select: { displayName: true, headline: true, city: true, country: true, phone: true, website: true, visibility: true, expertStatus: true, keywords: { select: { keyword: { select: { name: true } } } } } },
    },
  });
  const rows = users.map((u) => {
    const p = u.profile;
    const vis = (p?.visibility ?? {}) as { directory?: boolean };
    return [
      p?.displayName ?? "",
      TYPE[u.accountType] ?? u.accountType,
      u.email,
      p?.phone ?? "",
      p?.city ?? "",
      p?.country ?? "",
      p?.headline ?? "",
      p?.website ?? "",
      p?.keywords.map((k) => k.keyword.name).join(", ") ?? "",
      vis.directory === false ? "non" : "oui",
      p?.expertStatus === "APPROVED" ? "oui" : "",
      u.createdAt,
    ];
  });
  const csv = toCsv(["Nom affiché", "Type", "E-mail", "Téléphone", "Ville", "Pays", "Fonction", "Site web", "Mots-clés", "Visible dans l'annuaire", "Expert validé", "Inscrit le"], rows);
  await db.auditLog.create({ data: { userId: session.user.id, action: "export.annuaire", entity: "User", entityId: null, meta: { lignes: rows.length } } });
  return csvResponse(`annuaire-beninois-du-monde-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

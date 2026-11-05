import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { PLAN_LABEL } from "@/lib/adhesion";

/* Export CSV des adhésions HCBE (administrateurs) : comptabilité et relances. Contient les e-mails : usage interne. */

const STATUT: Record<string, string> = { ACTIVE: "En cours", PENDING: "En attente", EXPIRED: "Échue", CANCELLED: "Annulée" };

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return new Response("Réservé aux administrateurs.", { status: 403 });
  const rows = await db.membership.findMany({
    where: { status: { in: ["ACTIVE", "EXPIRED", "CANCELLED"] } },
    orderBy: [{ status: "asc" }, { endsAt: "desc" }],
    select: { plan: true, status: true, startsAt: true, endsAt: true, amount: true, currency: true, displayAmount: true, paymentRef: true, paymentMode: true, createdById: true, note: true, createdAt: true, user: { select: { email: true, profile: { select: { displayName: true, country: true, city: true } } } } },
  });
  await db.auditLog.create({ data: { userId: session.user.id, action: "export.adhesions", entity: "Membership", entityId: null, meta: { lignes: rows.length } } });
  const csv = toCsv(
    ["Nom", "E-mail", "Pays", "Ville", "Formule", "Statut", "Début", "Fin", "Montant encaissé (FCFA)", "Prix affiché", "Transaction FedaPay", "Moyen", "Activation", "Note", "Créée le"],
    rows.map((m) => [
      m.user.profile?.displayName ?? "",
      m.user.email,
      m.user.profile?.country ?? "",
      m.user.profile?.city ?? "",
      PLAN_LABEL[m.plan],
      STATUT[m.status] ?? m.status,
      m.startsAt,
      m.endsAt,
      m.paymentRef ? m.amount : "",
      m.displayAmount ?? "",
      m.paymentRef ?? "",
      m.paymentMode ?? "",
      m.createdById ? "manuelle" : "FedaPay",
      m.note ?? "",
      m.createdAt,
    ]),
  );
  return csvResponse(`adhesions-hcbe-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

import { cache } from "react";
import type { MembershipPlan } from "@prisma/client";
import { db } from "./db";
import { numberSetting, flag } from "./settings";

/* Adhésion HCBE (F-156) — règles métier fixées par le HCBE le 05/11/2026 :
   inscription gratuite pour tous ; adhésion optionnelle 20 €/an, 5 €/an pour les jeunes
   jusqu'à 20 ans et les étudiants ; 12 mois à compter de l'adhésion ; rappel 30 jours
   avant l'échéance, jamais de prélèvement automatique ; paiement FedaPay (Mobile Money,
   carte) encaissé en franc CFA ; activation manuelle possible par un administrateur.
   Le prix est affiché dans la devise du pays du membre (€, $, FCFA), l'encaissement se
   fait toujours en XOF (parité fixe 1 € = 655,957 FCFA). */

export const DUREE_MOIS = 12;
export const RAPPEL_JOURS = 30;
export const XOF_PAR_EUR = 655.957;

export const PLAN_LABEL: Record<MembershipPlan, string> = {
  ANNUEL: "Adhésion annuelle",
  ETUDIANT: "Tarif réduit (jeunes et étudiants)",
  HONNEUR: "Membre d'honneur",
};

export type Devise = "EUR" | "USD" | "CAD" | "XOF";

/* Pays où le franc CFA a cours (UEMOA + CEMAC, même parité avec l'euro). */
const ZONE_FCFA = new Set(["Bénin", "Togo", "Côte d'Ivoire", "Sénégal", "Niger", "Mali", "Burkina Faso", "Guinée-Bissau", "Cameroun", "Gabon", "Congo", "Tchad", "Centrafrique", "Guinée équatoriale"]);

/** Devise d'affichage selon le pays du profil : FCFA en zone franc, $ en Amérique du Nord, € ailleurs. */
export function deviseDuPays(pays: string | null | undefined): Devise {
  if (!pays) return "EUR";
  if (ZONE_FCFA.has(pays)) return "XOF";
  if (pays === "États-Unis") return "USD";
  if (pays === "Canada") return "CAD";
  return "EUR";
}

/* Mobile Money accepté par FedaPay, par pays (doc FedaPay « Moyens de paiement », 11/2026).
   Partout ailleurs : carte Visa / Mastercard (si la couverture « monde » est activée sur le compte FedaPay). */
export const MOBILE_MONEY: Record<string, string[]> = {
  Bénin: ["MTN Mobile Money", "Moov Money", "Celtiis Cash", "Coris Money"],
  "Côte d'Ivoire": ["MTN Mobile Money", "Moov Money", "Orange Money", "Wave"],
  Sénégal: ["Orange Money", "Wave", "Free Money"],
  Togo: ["Moov Money", "Mixx by Yas (T-Money)"],
  Niger: ["Airtel Money"],
  Mali: ["Orange Money"],
  "Burkina Faso": ["Moov Money", "Orange Money"],
  Guinée: ["MTN Mobile Money"],
};

/** Moyens de paiement proposés au membre selon son pays. */
export function moyensDePaiement(pays: string | null | undefined) {
  const mobile = pays ? MOBILE_MONEY[pays] ?? [] : [];
  return { mobile, carte: true };
}

const fmtMontant = (n: number, devise: Devise) => {
  if (devise === "XOF") return `${n.toLocaleString("fr-FR")} FCFA`;
  if (devise === "USD") return `${n.toLocaleString("fr-FR")} $ US`;
  if (devise === "CAD") return `${n.toLocaleString("fr-FR")} $ CA`;
  return `${n.toLocaleString("fr-FR")} €`;
};

/** Arrondi à 5 FCFA près, comme les tarifs affichés au Bénin. */
export const eurVersXof = (eur: number) => Math.round((eur * XOF_PAR_EUR) / 5) * 5;

export type Tarif = {
  plan: Exclude<MembershipPlan, "HONNEUR">;
  label: string;
  eur: number;
  xof: number;
  /** Montant dans la devise d'affichage du membre. */
  affiche: string;
  /** Montant réellement débité, en FCFA, affiché à côté si la devise diffère. */
  debite: string;
};

/** Les deux tarifs (réglables dans Paramètres), dans la devise du membre. */
export const tarifs = cache(async (devise: Devise): Promise<Tarif[]> => {
  const [plein, reduit, usd, usdReduit, cad, cadReduit] = await Promise.all([
    numberSetting("adhesion.prix"),
    numberSetting("adhesion.prix_reduit"),
    numberSetting("adhesion.prix_usd"),
    numberSetting("adhesion.prix_usd_reduit"),
    numberSetting("adhesion.prix_cad"),
    numberSetting("adhesion.prix_cad_reduit"),
  ]);
  const ligne = (plan: Tarif["plan"], eur: number, enUsd: number, enCad: number): Tarif => {
    const xof = eurVersXof(eur);
    const local = devise === "XOF" ? xof : devise === "USD" ? enUsd : devise === "CAD" ? enCad : eur;
    return { plan, label: PLAN_LABEL[plan], eur, xof, affiche: fmtMontant(local, devise), debite: fmtMontant(xof, "XOF") };
  };
  return [ligne("ANNUEL", plein, usd, cad), ligne("ETUDIANT", reduit, usdReduit, cadReduit)];
});

/** L'adhésion est proposée aux membres (interrupteur Paramètres → Sécurité & validation). */
export function adhesionProposee() {
  return flag("adhesion.proposer");
}

/** Adhésion en cours d'un membre (ACTIVE et non échue), ou null. */
export const adhesionActive = cache(async (userId: string) => {
  return db.membership.findFirst({
    where: { userId, status: "ACTIVE", endsAt: { gt: new Date() } },
    orderBy: { endsAt: "desc" },
    select: { id: true, plan: true, startsAt: true, endsAt: true },
  });
});

/** Point d'entrée unique pour les accès réservés aux adhérents. */
export async function isAdherent(userId: string | null | undefined) {
  if (!userId) return false;
  return Boolean(await adhesionActive(userId));
}

/** Identifiants des adhérents parmi une liste de membres (cartes des annuaires). */
export async function adherentsParmi(userIds: string[]) {
  if (userIds.length === 0) return new Set<string>();
  const rows = await db.membership.findMany({ where: { userId: { in: userIds }, status: "ACTIVE", endsAt: { gt: new Date() } }, select: { userId: true } });
  return new Set(rows.map((r) => r.userId));
}

export function ajouterMois(d: Date, mois: number) {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() + mois);
  return r;
}

/** Active une adhésion (paiement confirmé ou activation manuelle). Idempotent : une ligne déjà ACTIVE n'est pas modifiée.
    Un renouvellement démarre à la fin de l'adhésion en cours pour ne pas faire perdre de jours. */
export async function activerAdhesion(membershipId: string, extra: { paymentRef?: string; paymentMode?: string | null } = {}) {
  return db.$transaction(async (tx) => {
    const m = await tx.membership.findUnique({ where: { id: membershipId }, select: { id: true, userId: true, status: true, endsAt: true } });
    if (!m) return null;
    if (m.status === "ACTIVE") return m;
    const now = new Date();
    const enCours = await tx.membership.findFirst({ where: { userId: m.userId, status: "ACTIVE", endsAt: { gt: now }, id: { not: m.id } }, orderBy: { endsAt: "desc" }, select: { endsAt: true } });
    const startsAt = enCours?.endsAt ?? now;
    return tx.membership.update({
      where: { id: m.id },
      data: { status: "ACTIVE", startsAt, endsAt: ajouterMois(startsAt, DUREE_MOIS), ...(extra.paymentRef && { paymentRef: extra.paymentRef }), ...(extra.paymentMode !== undefined && { paymentMode: extra.paymentMode }) },
      select: { id: true, userId: true, status: true, endsAt: true },
    });
  });
}

/** Jours restants avant une échéance (0 si absente ou passée). */
export const joursAvant = (d: Date | null | undefined) => (d ? Math.max(0, Math.ceil((d.getTime() - new Date().getTime()) / 864e5)) : 0);

export const fmtEcheance = (d: Date | null | undefined) => (d ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "");

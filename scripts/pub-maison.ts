/* Campagnes « maison » : les 4 sites du groupe, sur les 4 emplacements, en
   modèle carte (logo + accroche + couleur). Relançable : met à jour sans
   dupliquer (clé = titre). Usage : pnpm pub:maison  (DATABASE_URL=… pour Neon) */
import { PrismaClient, type BannerSlot } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const SITES = [
  { key: "wanilo", advertiser: "Wanilo Studio", link: "https://www.wanilo.studio/", headline: "Wanilo Studio", tagline: "Studio podcast, vidéo et photo à Cotonou. Matériel pro, décors premium, équipe dédiée.", alt: "Wanilo Studio, studio podcast, vidéo et photo à Cotonou", bg: "#111111", fg: "#ffffff" },
  { key: "petit-train", advertiser: "Le Petit Train de Cotonou", link: "https://www.petit-train-cotonou.com", headline: "Le Petit Train de Cotonou", tagline: "En 30 minutes ou 1 heure, découvrez le Cotonou moderne lors d'une balade commentée, en famille ou entre amis.", alt: "Le Petit Train de Cotonou, balade commentée dans la ville", bg: "#c8102e", fg: "#ffffff" },
  { key: "dahomey-discovery", advertiser: "Dahomey Discovery", link: "https://dahomeydiscovery.com/", headline: "Dahomey Discovery", tagline: "Découvrez le Bénin avec sens : circuits, hébergements, transferts. Reconnectez-vous à la Terre Mère.", alt: "Dahomey Discovery, voyages et circuits au Bénin", bg: "#1f3a2a", fg: "#ffffff" },
  { key: "bonne-arrivee", advertiser: "Bonne Arrivée — Tourisme au Bénin", link: "https://www.bonnearrivee.bj", headline: "Bonne Arrivée", tagline: "Le portail officiel du tourisme au Bénin : merveilles, culture, séjours.", alt: "Bonne Arrivée, portail du tourisme au Bénin", bg: "#0b3d2e", fg: "#ffffff" },
];
const SLOTS: BannerSlot[] = ["TOP", "SIDE", "MID", "BOTTOM"];

async function main() {
  let created = 0, updated = 0;
  for (const s of SITES) for (const slot of SLOTS) {
    const title = `Maison — ${s.advertiser} — ${slot}`;
    const data = { advertiser: s.advertiser, slot, kind: "CARD" as const, image: `/pub/${s.key}-logo.png`, alt: s.alt, headline: s.headline, tagline: s.tagline, bg: s.bg, fg: s.fg, link: s.link, house: true, status: "PUBLISHED" as const, weight: 1 };
    const existing = await db.banner.findFirst({ where: { title }, select: { id: true } });
    if (existing) { await db.banner.update({ where: { id: existing.id }, data }); updated++; }
    else { await db.banner.create({ data: { ...data, title, startsAt: new Date() } }); created++; }
  }
  console.log(`Campagnes maison : ${created} créées, ${updated} mises à jour (${SITES.length} sites × ${SLOTS.length} emplacements).`);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

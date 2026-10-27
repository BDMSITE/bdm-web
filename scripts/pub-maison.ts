/* Campagnes « maison » : les 4 sites du groupe, sur les 4 emplacements, en
   modèle carte (logo + accroche + couleur). Relançable : met à jour sans
   dupliquer (clé = titre). Usage : pnpm pub:maison  (DATABASE_URL=… pour Neon) */
import { PrismaClient, type BannerSlot } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const SITES = [
  { key: "wanilo", advertiser: "Wanilo Studio", link: "https://www.wanilo.studio/", headline: "Votre voix mérite un vrai studio", tagline: "Podcast, vidéo et photo à Cotonou : matériel pro, décors premium, équipe dédiée.", alt: "Wanilo Studio, studio podcast, vidéo et photo à Cotonou", bg: "#15080f", fg: "#ffffff" },
  { key: "petit-train", advertiser: "Le Petit Train de Cotonou", link: "https://www.petit-train-cotonou.com", headline: "Cotonou en 1 heure, autrement", tagline: "Balade commentée du Cotonou moderne, en famille ou entre amis. Privatisable.", alt: "Le Petit Train de Cotonou, balade commentée dans la ville", bg: "#8f0f1c", fg: "#ffffff" },
  { key: "dahomey-discovery", advertiser: "Dahomey Discovery", link: "https://dahomeydiscovery.com/", headline: "Le Bénin, avec sens", tagline: "Circuits, hébergements, transferts : reconnectez-vous à la Terre Mère.", alt: "Dahomey Discovery, voyages et circuits au Bénin", bg: "#2b1a0e", fg: "#ffffff" },
  { key: "bonne-arrivee", advertiser: "Bonne Arrivée", link: "https://www.bonnearrivee.bj", headline: "Bonne arrivée au Bénin", tagline: "Le portail officiel du tourisme : merveilles, culture, séjours.", alt: "Bonne Arrivée, portail du tourisme au Bénin", bg: "#0b3d2e", fg: "#ffffff" },
];
const SLOTS: BannerSlot[] = ["TOP", "SIDE", "MID", "BOTTOM"];

async function main() {
  let created = 0, updated = 0;
  for (const s of SITES) for (const slot of SLOTS) {
    const title = `Maison — ${s.advertiser} — ${slot}`;
    const data = { advertiser: s.advertiser, slot, kind: "CARD" as const, image: `/pub/${s.key}-logo.png`, photo: `/pub/photos/${s.key}-${slot === "SIDE" ? "pave" : "large"}.jpg`, alt: s.alt, headline: s.headline, tagline: s.tagline, bg: s.bg, fg: s.fg, link: s.link, house: true, status: "PUBLISHED" as const, weight: 1 };
    const existing = await db.banner.findFirst({ where: { title }, select: { id: true } });
    if (existing) { await db.banner.update({ where: { id: existing.id }, data }); updated++; }
    else { await db.banner.create({ data: { ...data, title, startsAt: new Date() } }); created++; }
  }
  console.log(`Campagnes maison : ${created} créées, ${updated} mises à jour (${SITES.length} sites × ${SLOTS.length} emplacements).`);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

/* Campagnes « maison » : les 4 sites du groupe, sur les 4 emplacements, en
   modèle carte (logo + accroche + couleur). Relançable : met à jour sans
   dupliquer (clé = titre). Usage : pnpm pub:maison  (DATABASE_URL=… pour Neon) */
import { PrismaClient, type BannerSlot } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const SITES = [
  { key: "wanilo", advertiser: "Wanilo Studio", link: "https://www.wanilo.studio/", headline: "Enregistrez comme les pros, à Cotonou", tagline: "Podcast, vidéo, photo : plateau équipé, décors premium, équipe à vos côtés. Votre prochain épisode commence ici.", cta: "Réserver le studio", alt: "Wanilo Studio, studio podcast, vidéo et photo à Cotonou", bg: "#15080f", fg: "#ffffff" },
  { key: "petit-train", advertiser: "Le Petit Train de Cotonou", link: "https://www.petit-train-cotonou.com", headline: "Montez à bord, Cotonou défile", tagline: "30 minutes ou 1 heure de balade commentée : monuments, bord de mer, sourires. En famille, entre amis, ou privatisé pour vos événements.", cta: "Embarquer", alt: "Le Petit Train de Cotonou, balade commentée dans la ville", bg: "#8f0f1c", fg: "#ffffff" },
  { key: "dahomey-discovery", advertiser: "Dahomey Discovery", link: "https://dahomeydiscovery.com/", headline: "Revenez au pays, autrement", tagline: "Circuits sur mesure, hébergements de charme, transferts assurés : vivez le Bénin de l'intérieur, de Ouidah à la Pendjari.", cta: "Composer mon voyage", alt: "Dahomey Discovery, voyages et circuits au Bénin", bg: "#2b1a0e", fg: "#ffffff" },
  { key: "bonne-arrivee", advertiser: "Bonne Arrivée", link: "https://www.bonnearrivee.bj", headline: "Le Bénin vous dit : bonne arrivée !", tagline: "Plages, palais royaux, Ganvié, festivals : le portail officiel du tourisme pour préparer votre séjour.", cta: "Préparer mon séjour", alt: "Bonne Arrivée, portail officiel du tourisme au Bénin", bg: "#0b3d2e", fg: "#ffffff" },
];
const SLOTS: BannerSlot[] = ["TOP", "SIDE", "MID", "BOTTOM"];

async function main() {
  let created = 0, updated = 0;
  for (const s of SITES) for (const slot of SLOTS) {
    const title = `Maison — ${s.advertiser} — ${slot}`;
    const data = { advertiser: s.advertiser, slot, kind: "CARD" as const, image: `/pub/${s.key}-logo.png`, photo: `/pub/photos/${s.key}-${slot === "SIDE" ? "pave" : "large"}.jpg`, alt: s.alt, headline: s.headline, tagline: s.tagline, cta: s.cta, bg: s.bg, fg: s.fg, link: s.link, house: true, status: "PUBLISHED" as const, weight: 1 };
    const existing = await db.banner.findFirst({ where: { title }, select: { id: true } });
    if (existing) { await db.banner.update({ where: { id: existing.id }, data }); updated++; }
    else { await db.banner.create({ data: { ...data, title, startsAt: new Date() } }); created++; }
  }
  console.log(`Campagnes maison : ${created} créées, ${updated} mises à jour (${SITES.length} sites × ${SLOTS.length} emplacements).`);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

import "dotenv/config";
import { writeFileSync } from "node:fs";
import { PrismaClient, type ContentType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { slugify } from "../src/lib/slug";

/* Reprise des contenus de l'ancien site WordPress du HCBE (beninois-du-monde.com)
   via son API REST : lieux de mémoire, itinéraires, ressources, guides, et la
   Charte de la communauté. Contenu rédigé et publié par le HCBE — importé tel
   quel avec sa source, à faire relire. Relançable (clé = slug wp-…).

   Usage : pnpm import:wordpress [--go] */

const BASE = process.env.WP_BASE ?? "https://beninois-du-monde.com";
const UA = { "User-Agent": "Mozilla/5.0 bdm-web-import" };

const TYPES: { wp: string; type: ContentType; keyword: string; category?: (title: string) => string }[] = [
  { wp: "hcbe_lieu", type: "MEMORY_PLACE", keyword: "Mémoire", category: categorieLieu },
  { wp: "hcbe_itineraire", type: "ARTICLE", keyword: "Itinéraire mémoriel" },
];

const VILLES = ["Ouidah", "Porto-Novo", "Abomey", "Cotonou", "Ganvié", "Grand-Popo", "Dassa-Zoumè", "Koussoukoingou", "Natitingou", "Parakou", "Kota", "Pendjari", "Possotomè"];

function categorieLieu(t: string) {
  const n = t.toLowerCase();
  if (/porte du non|arbre|route de l|mémorial|zoungbodji/.test(n)) return "Mémoire de la traite";
  if (/musée|fondation/.test(n)) return "Musée";
  if (/palais|tata|place de l/.test(n)) return "Patrimoine historique";
  if (/temple|forêt sacrée|mosquée|collines/.test(n)) return "Lieu sacré";
  if (/parc|cascade|lac|bouche|cité lacustre|grand-popo/.test(n)) return "Site naturel";
  return "Lieu de mémoire";
}

const decode = (s: string) => s.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c)).replace(/&(rsquo|#8217);/g, "’").replace(/&(lsquo|#8216);/g, "‘").replace(/&(ldquo|#8220);/g, "«").replace(/&(rdquo|#8221);/g, "»").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&(eacute|egrave|agrave|ccedil);/g, (m) => ({ "&eacute;": "é", "&egrave;": "è", "&agrave;": "à", "&ccedil;": "ç" })[m] ?? m);
const texte = (html: string) =>
  decode(html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|h[1-6]|li|div)>/gi, "\n\n").replace(/<[^>]+>/g, "")).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

async function wp<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}/wp-json/wp/v2/${path}`, { headers: UA });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json() as Promise<T>;
}

type Post = { id: number; slug: string; title: { rendered: string }; content: { rendered: string }; link: string; modified: string; featured_media: number };

async function main() {
  const go = process.argv.includes("--go");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const kwId = async (name: string, family: "THEME" | "PLACE" | "SECTOR") =>
    (await db.keyword.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name), family } })).id;

  let crees = 0, maj = 0, ignores = 0;
  for (const t of TYPES) {
    const posts = await wp<Post[]>(`${t.wp}?per_page=50&status=publish`);
    for (const p of posts) {
      const title = decode(p.title.rendered).trim();
      const body = texte(p.content.rendered);
      if (body.length < 40) { ignores++; console.log(`  ignoré (vide) : ${title}`); continue; }
      const slug = `wp-${p.slug}`.slice(0, 120);
      const city = VILLES.find((v) => title.toLowerCase().includes(v.toLowerCase())) ?? null;
      const excerpt = body.split(/\n\n/)[0].slice(0, 280);
      const src = `\n\n_Source : ${p.link} — contenu publié par le HCBE sur l'ancien site, repris le ${new Date().toLocaleDateString("fr-FR")}._`;
      const data = { type: t.type, title, excerpt, body: body + src, country: "Bénin", city, status: "PUBLISHED" as const, publishedAt: new Date(p.modified) };
      console.log(`  ${t.type} · ${title}${city ? ` (${city})` : ""} · ${body.length} car.`);
      if (!go) { crees++; continue; }
      const kws = [await kwId(t.keyword, "THEME"), await kwId("Bénin", "PLACE"), ...(city ? [await kwId(city, "PLACE")] : [])];
      const existing = await db.content.findUnique({ where: { slug }, select: { id: true } });
      if (existing) {
        await db.content.update({ where: { id: existing.id }, data: { ...data, keywords: { deleteMany: {}, create: kws.map((keywordId) => ({ keywordId })) } } });
        if (t.type === "MEMORY_PLACE") await db.placeDetails.upsert({ where: { contentId: existing.id }, update: { category: t.category!(title) }, create: { contentId: existing.id, category: t.category!(title) } });
        maj++;
      } else {
        await db.content.create({ data: { ...data, slug, keywords: { create: kws.map((keywordId) => ({ keywordId })) }, ...(t.type === "MEMORY_PLACE" && { place: { create: { category: t.category!(title), verified: false } } }) } });
        crees++;
      }
    }
  }

  // Charte de la communauté → fichier statique versionné (lu par /legal/cgu)
  const [charte] = await wp<Post[]>("pages?slug=charte-communaute&_fields=slug,title,content,link,modified");
  if (charte) {
    const blocks: { type: "h" | "p" | "li"; text: string }[] = [];
    const re = /<(h[1-6]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(charte.content.rendered))) {
      const txt = texte(m[2]);
      if (txt) blocks.push({ type: m[1].startsWith("h") ? "h" : m[1] === "li" ? "li" : "p", text: txt });
    }
    writeFileSync("src/content/charte-communaute.json", JSON.stringify({ title: decode(charte.title.rendered), source: charte.link, modified: charte.modified.slice(0, 10), blocks }, null, 2) + "\n");
    console.log(`\nCharte de la communauté : ${blocks.length} blocs → src/content/charte-communaute.json`);
  }

  console.log(`\n${go ? "Créés ou mis à jour" : "À créer (simulation)"} : ${crees + maj}${go ? ` (dont mis à jour : ${maj})` : ""} · ignorés : ${ignores}`);
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

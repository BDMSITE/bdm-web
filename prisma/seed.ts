import "dotenv/config";
import { PrismaClient, type ContentType, type KeywordFamily, type AccountType, type Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "argon2";

/* Seed de démo — charge les données d'exemple de la maquette pour que les
   pages passent du statique au dynamique sans changer de rendu.
   Relançable : tout est recréé à partir de zéro (pnpm prisma db seed). */

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const DEMO_PASSWORD = "bdm-demo-2026";

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const KEYWORDS: { name: string; family: KeywordFamily }[] = [
  ...["Informatique", "Santé", "Finance", "BTP", "Éducation", "Droit", "Commerce", "Logistique", "Agriculture", "Art & spectacle", "Énergie"].map((name) => ({ name, family: "SECTOR" as const })),
  ...["Bénin", "France", "Canada", "Belgique", "USA", "Côte d'Ivoire", "Togo", "Cotonou", "Paris", "Montréal", "Bruxelles", "New York", "Abidjan", "Lomé", "Marseille", "Ouidah", "Parakou"].map((name) => ({ name, family: "PLACE" as const })),
  ...["Retour au pays", "Étudiants", "Mémoire", "Afrodescendants", "Culture", "Emploi", "Communauté", "Entrepreneuriat", "Portrait"].map((name) => ({ name, family: "THEME" as const })),
];

const USERS: {
  email: string;
  name: string;
  role?: Role;
  accountType?: AccountType;
  city: string;
  country: string;
  lat: number;
  lng: number;
  bio: string;
  keywords: string[];
  cvPublished?: boolean;
}[] = [
  { email: "admin@beninoisdumonde.test", name: "Admin BDM", role: "ADMIN", city: "Cotonou", country: "Bénin", lat: 6.37, lng: 2.39, bio: "Administration du portail.", keywords: ["Cotonou"] },
  { email: "aichatou@beninoisdumonde.test", name: "Aïchatou S.", city: "Cotonou", country: "Bénin", lat: 6.37, lng: 2.39, bio: "Ingénieure BTP revenue de Montréal, bureau d'études à Cotonou.", keywords: ["BTP", "Entrepreneuriat", "Retour au pays", "Cotonou"] },
  { email: "jeaneudes@beninoisdumonde.test", name: "Jean-Eudes K.", city: "Paris", country: "France", lat: 48.85, lng: 2.35, bio: "Architecte logiciel, mentorat des jeunes devs béninois.", keywords: ["Informatique", "Paris"], cvPublished: true },
  { email: "mariam@beninoisdumonde.test", name: "Mariam A.", city: "Montréal", country: "Canada", lat: 45.5, lng: -73.57, bio: "Médecin de santé publique, afrodescendante en quête de racines.", keywords: ["Santé", "Afrodescendants", "Montréal"], cvPublished: true },
  { email: "rodrigue@beninoisdumonde.test", name: "Rodrigue H.", city: "Bruxelles", country: "Belgique", lat: 50.85, lng: 4.35, bio: "Analyste financier senior.", keywords: ["Finance", "Bruxelles"] },
  { email: "nadege@beninoisdumonde.test", name: "Nadège G.", city: "New York", country: "USA", lat: 40.71, lng: -74.01, bio: "Avocate d'affaires.", keywords: ["Droit", "Afrodescendants", "New York"], cvPublished: true },
];

type ContentSeed = {
  type: ContentType;
  title: string;
  excerpt: string;
  body?: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  owner?: string;
  featured?: boolean;
  keywords: string[];
  job?: { contractType: string; salary?: string };
  event?: { startsAt: string; venue: string; category: string; isOnline?: boolean };
  place?: { category: string; address: string; verified?: boolean };
  deal?: { promoCode?: string; conditions: string };
  classified?: { category: string; price?: string };
};

const CONTENTS: ContentSeed[] = [
  // Magazine
  { type: "MEMBER_ARTICLE", title: "Le vodun expliqué à mes enfants nés en France", excerpt: "Comment transmettre une spiritualité quand on vit à Lyon.", city: "Lyon", country: "France", lat: 45.76, lng: 4.84, owner: "jeaneudes@beninoisdumonde.test", keywords: ["Mémoire", "Culture", "France"] },
  // Emploi
  // Agenda
  // Bonnes adresses
  { type: "PLACE", title: "Chez Maman Bénin", excerpt: "Restaurant béninois, le meilleur amiwo de Paris.", city: "Paris", country: "France", lat: 48.89, lng: 2.35, keywords: ["Paris"], place: { category: "Restaurant", address: "Paris 18e", verified: true } },
  { type: "PLACE", title: "Épicerie Dantokpa", excerpt: "Produits du pays, gari et huile rouge.", city: "Bruxelles", country: "Belgique", lat: 50.85, lng: 4.35, keywords: ["Bruxelles"], place: { category: "Épicerie", address: "Matongé" } },
  { type: "PLACE", title: "Salon Wax & Co", excerpt: "Mode et tissus wax.", city: "Montréal", country: "Canada", lat: 45.5, lng: -73.57, keywords: ["Montréal"], place: { category: "Mode", address: "Quartier Villeray" } },
  // Avantages
  { type: "DEAL", title: "-10 % sur les billets Cotonou ↔ Paris", excerpt: "Agence partenaire, réservation en ligne.", city: "Paris", country: "France", lat: 48.85, lng: 2.35, keywords: ["Paris", "Cotonou"], deal: { promoCode: "BDM10", conditions: "Membres inscrits, hors haute saison." } },
  { type: "DEAL", title: "Frais réduits sur vos transferts d'argent", excerpt: "Partenaire transfert.", city: "Cotonou", country: "Bénin", lat: 6.37, lng: 2.39, keywords: ["Bénin"], deal: { conditions: "Premier transfert offert." } },
  { type: "DEAL", title: "-15 % sur l'hôtel à Ouidah", excerpt: "Hôtel partenaire face à la plage.", city: "Ouidah", country: "Bénin", lat: 6.36, lng: 2.09, keywords: ["Ouidah", "Mémoire"], deal: { promoCode: "RACINES15", conditions: "Sur présentation de la carte membre." } },
  // Mémoire
  { type: "MEMORY_PLACE", title: "Porte du Non-Retour", excerpt: "Mémorial de la traite atlantique, sur la plage de Ouidah.", city: "Ouidah", country: "Bénin", lat: 6.33, lng: 2.08, keywords: ["Mémoire", "Afrodescendants", "Ouidah"], place: { category: "Traite atlantique", address: "Plage de Ouidah", verified: true } },
  { type: "MEMORY_PLACE", title: "Route de l'Esclave", excerpt: "4 km de la place des enchères à la plage.", city: "Ouidah", country: "Bénin", lat: 6.35, lng: 2.09, keywords: ["Mémoire", "Ouidah"], place: { category: "Itinéraire mémoriel", address: "Ouidah", verified: true } },
  { type: "MEMORY_PLACE", title: "Palais royaux d'Abomey", excerpt: "Site UNESCO du royaume du Danxomè.", city: "Abomey", country: "Bénin", lat: 7.18, lng: 1.99, keywords: ["Mémoire"], place: { category: "Royaume du Danxomè", address: "Abomey", verified: true } },
  { type: "MEMORY_PLACE", title: "Temple des Pythons", excerpt: "Haut lieu du vodun à Ouidah.", city: "Ouidah", country: "Bénin", lat: 6.36, lng: 2.09, keywords: ["Mémoire", "Culture", "Ouidah"], place: { category: "Vodun", address: "Ouidah centre", verified: true } },
  // Petites annonces
  { type: "CLASSIFIED", title: "Billet Paris–Cotonou à céder (décembre)", excerpt: "Aller simple, nom modifiable.", city: "Paris", country: "France", lat: 48.85, lng: 2.35, owner: "jeaneudes@beninoisdumonde.test", keywords: ["Paris", "Cotonou"], classified: { category: "bonnes-affaires", price: "420 €" } },
];

async function main() {
  console.log("Seed de démo — nettoyage…");
  await db.$transaction([
    db.content.deleteMany(),
    db.keyword.deleteMany(),
    db.user.deleteMany(),
  ]);

  console.log("Mots-clés…");
  const keywordBySlug = new Map<string, string>();
  for (const k of KEYWORDS) {
    const slug = slugify(k.name);
    const row = await db.keyword.create({ data: { name: k.name, slug, family: k.family } });
    keywordBySlug.set(slug, row.id);
  }
  const kw = (names: string[]) =>
    names.map((n) => ({ keyword: { connect: { id: keywordBySlug.get(slugify(n))! } } }));

  console.log("Comptes et profils…");
  const passwordHash = await hash(DEMO_PASSWORD);
  const profileByEmail = new Map<string, string>();
  for (const u of USERS) {
    const user = await db.user.create({
      data: {
        email: u.email,
        name: u.name,
        emailVerified: new Date(),
        passwordHash,
        role: u.role ?? "USER",
        accountType: u.accountType ?? "MEMBER",
        status: "ACTIVE",
        profile: {
          create: {
            displayName: u.name,
            slug: slugify(u.name),
            bio: u.bio,
            city: u.city,
            country: u.country,
            lat: u.lat,
            lng: u.lng,
            visibility: { directory: true },
            cvPublished: u.cvPublished ?? false,
            keywords: { create: kw(u.keywords) },
            ...(u.accountType === "COMPANY" && { company: { create: { size: "10-49", sector: "Fintech" } } }),
            ...(u.accountType === "ASSOCIATION" && { association: { create: { purpose: "Entraide et culture", foundedYear: 1998, membersCount: 240 } } }),
            ...(u.accountType === "ARTIST" && { artist: { create: { discipline: "Musique" } } }),
          },
        },
      },
      include: { profile: true },
    });
    profileByEmail.set(u.email, user.profile!.id);
  }

  console.log("Contenus…");
  const now = new Date();
  for (const [i, c] of CONTENTS.entries()) {
    await db.content.create({
      data: {
        type: c.type,
        title: c.title,
        slug: slugify(c.title),
        excerpt: c.excerpt,
        body: c.body,
        city: c.city,
        country: c.country,
        lat: c.lat,
        lng: c.lng,
        status: "PUBLISHED",
        publishedAt: new Date(now.getTime() - i * 36e5),
        featured: c.featured ?? false,
        ownerProfileId: c.owner ? profileByEmail.get(c.owner) : undefined,
        keywords: { create: kw(c.keywords) },
        ...(c.job && { job: { create: { contractType: c.job.contractType, salary: c.job.salary, applyMode: "relay_email" } } }),
        ...(c.event && { event: { create: { startsAt: new Date(c.event.startsAt), venue: c.event.venue, category: c.event.category, isOnline: c.event.isOnline ?? false } } }),
        ...(c.place && { place: { create: { category: c.place.category, address: c.place.address, verified: c.place.verified ?? false } } }),
        ...(c.deal && { deal: { create: { promoCode: c.deal.promoCode, conditions: c.deal.conditions } } }),
        ...(c.classified && { classified: { create: { category: c.classified.category, price: c.classified.price } } }),
      },
    });
  }

  await db.profile.updateMany({ data: { publishedCount: 0 } });
  for (const profileId of profileByEmail.values()) {
    const n = await db.content.count({ where: { ownerProfileId: profileId, status: "PUBLISHED" } });
    await db.profile.update({ where: { id: profileId }, data: { publishedCount: n } });
  }

  console.log(`OK — ${USERS.length} comptes, ${KEYWORDS.length} mots-clés, ${CONTENTS.length} contenus. Mot de passe démo : voir DEMO_PASSWORD dans prisma/seed.ts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

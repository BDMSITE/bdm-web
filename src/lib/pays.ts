/* Référentiel des pays (noms français usuels) : suggestions dans les formulaires et
   normalisation à l'enregistrement, pour que « USA », « usa », « Etats Unis » et
   « États-Unis » ne fassent qu'un dans les filtres, la carte et les alertes. */

export const PAYS: string[] = `Afghanistan|Afrique du Sud|Albanie|Algérie|Allemagne|Andorre|Angola|Arabie saoudite|Argentine|Arménie|Australie|Autriche|Azerbaïdjan|Bahamas|Bahreïn|Bangladesh|Belgique|Bénin|Biélorussie|Bolivie|Bosnie-Herzégovine|Botswana|Brésil|Bulgarie|Burkina Faso|Burundi|Cambodge|Cameroun|Canada|Cap-Vert|Centrafrique|Chili|Chine|Chypre|Colombie|Comores|Congo|Corée du Sud|Costa Rica|Côte d'Ivoire|Croatie|Cuba|Danemark|Djibouti|Égypte|Émirats arabes unis|Équateur|Érythrée|Espagne|Estonie|Eswatini|États-Unis|Éthiopie|Finlande|France|Gabon|Gambie|Géorgie|Ghana|Grèce|Guadeloupe|Guinée|Guinée équatoriale|Guinée-Bissau|Guyane|Haïti|Hongrie|Inde|Indonésie|Irak|Iran|Irlande|Islande|Israël|Italie|Jamaïque|Japon|Jordanie|Kazakhstan|Kenya|Koweït|Laos|Lettonie|Liban|Liberia|Libye|Liechtenstein|Lituanie|Luxembourg|Madagascar|Malaisie|Malawi|Mali|Malte|Maroc|Martinique|Maurice|Mauritanie|Mayotte|Mexique|Moldavie|Monaco|Mongolie|Monténégro|Mozambique|Namibie|Népal|Niger|Nigeria|Norvège|Nouvelle-Calédonie|Nouvelle-Zélande|Oman|Ouganda|Ouzbékistan|Pakistan|Panama|Paraguay|Pays-Bas|Pérou|Philippines|Pologne|Polynésie française|Portugal|Qatar|RD Congo|République dominicaine|République tchèque|Réunion|Roumanie|Royaume-Uni|Russie|Rwanda|Sao Tomé-et-Principe|Sénégal|Serbie|Seychelles|Sierra Leone|Singapour|Slovaquie|Slovénie|Somalie|Soudan|Soudan du Sud|Sri Lanka|Suède|Suisse|Syrie|Taïwan|Tanzanie|Tchad|Thaïlande|Togo|Trinité-et-Tobago|Tunisie|Turquie|Ukraine|Uruguay|Venezuela|Viêt Nam|Yémen|Zambie|Zimbabwe`.split("|");

/* Pays les plus présents dans la diaspora béninoise : proposés en premier. */
export const PAYS_FREQUENTS = ["Bénin", "France", "Canada", "Belgique", "États-Unis", "Côte d'Ivoire", "Togo", "Nigeria", "Sénégal", "Gabon", "Allemagne", "Royaume-Uni", "Suisse", "Italie", "Espagne", "Maroc", "Ghana", "Burkina Faso", "Niger", "Cameroun", "Congo", "RD Congo", "Afrique du Sud", "Chine", "Émirats arabes unis", "Brésil"];

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const ALIAS: Record<string, string> = {
  usa: "États-Unis", "etats unis": "États-Unis", "etats unis d amerique": "États-Unis", "united states": "États-Unis", us: "États-Unis", america: "États-Unis",
  uk: "Royaume-Uni", angleterre: "Royaume-Uni", "grande bretagne": "Royaume-Uni", england: "Royaume-Uni", "united kingdom": "Royaume-Uni",
  benin: "Bénin", "republique du benin": "Bénin", "rep du benin": "Bénin",
  "cote d ivoire": "Côte d'Ivoire", "ivory coast": "Côte d'Ivoire", rci: "Côte d'Ivoire",
  deutschland: "Allemagne", germany: "Allemagne", belgium: "Belgique", switzerland: "Suisse", schweiz: "Suisse", italia: "Italie", italy: "Italie", espana: "Espagne", spain: "Espagne",
  "pays bas": "Pays-Bas", hollande: "Pays-Bas", netherlands: "Pays-Bas", nederland: "Pays-Bas",
  "congo kinshasa": "RD Congo", rdc: "RD Congo", "republique democratique du congo": "RD Congo", "congo brazzaville": "Congo", "republique du congo": "Congo",
  "emirats": "Émirats arabes unis", "emirats arabes unis": "Émirats arabes unis", dubai: "Émirats arabes unis", uae: "Émirats arabes unis",
  "afrique du sud": "Afrique du Sud", "south africa": "Afrique du Sud",
  "guinee conakry": "Guinée", "guinee equatoriale": "Guinée équatoriale",
  "republique centrafricaine": "Centrafrique", rca: "Centrafrique",
  "coree": "Corée du Sud", "coree du sud": "Corée du Sud",
  "vietnam": "Viêt Nam", "viet nam": "Viêt Nam",
  "cap vert": "Cap-Vert", "ile maurice": "Maurice", "la reunion": "Réunion",
  canada: "Canada", quebec: "Canada", montreal: "Canada", france: "France", paris: "France",
  brasil: "Brésil", brazil: "Brésil", china: "Chine", morocco: "Maroc", senegal: "Sénégal", cameroon: "Cameroun", niger: "Niger", togo: "Togo", nigeria: "Nigeria", ghana: "Ghana", gabon: "Gabon", mali: "Mali",
};

const CANON = new Map(PAYS.map((p) => [fold(p), p]));

/** Nom canonique d'un pays ; la saisie est conservée telle quelle si elle est inconnue. */
export function normalizeCountry(input: string | null | undefined): string {
  const raw = (input ?? "").trim().replace(/\s+/g, " ");
  if (!raw) return "";
  const f = fold(raw);
  return ALIAS[f] ?? CANON.get(f) ?? raw;
}

/** Ville : espaces nettoyés, première lettre en capitale (« cotonou » → « Cotonou »). */
export function normalizeCity(input: string | null | undefined): string {
  const raw = (input ?? "").trim().replace(/\s+/g, " ");
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const AU = new Set(["Bénin","Canada","Togo","Nigeria","Sénégal","Gabon","Maroc","Ghana","Burkina Faso","Niger","Cameroun","Congo","RD Congo","Brésil","Mali","Luxembourg","Portugal","Royaume-Uni","Japon","Liban","Qatar","Koweït","Danemark","Mexique","Pérou","Chili","Viêt Nam","Kenya","Rwanda","Mozambique","Zimbabwe","Botswana","Soudan","Soudan du Sud","Tchad","Liberia","Malawi","Burundi","Cambodge","Laos","Népal","Pakistan","Bangladesh","Sri Lanka","Panama","Paraguay","Venezuela","Costa Rica","Yémen","Oman","Bahreïn","Monténégro","Kazakhstan","Liechtenstein","Zambie"]);
const AUX = new Set(["États-Unis","Pays-Bas","Émirats arabes unis","Comores","Seychelles","Philippines","Bahamas"]);

/** « au Bénin », « aux États-Unis », « en France », « à Maurice ». */
export function enPays(pays: string) {
  if (AUX.has(pays)) return `aux ${pays}`;
  if (AU.has(pays)) return `au ${pays}`;
  if (["Maurice","Madagascar","Cuba","Haïti","Singapour","Malte","Chypre","Monaco","Djibouti","Mayotte","Taïwan","Sao Tomé-et-Principe","Trinité-et-Tobago"].includes(pays)) return `à ${pays}`;
  return `en ${pays}`;
}

import { db } from "@/lib/db";
import { sendHelpAlert } from "@/lib/mail";
import { SITE_URL } from "@/lib/site-url";
import { contentHref } from "@/lib/routes";

/* Alertes d'entraide : à la publication d'un besoin, les membres volontaires de la
   même ville (ou du pays si la ville manque) reçoivent un e-mail. Module serveur. */

/** Nombre maximal de volontaires prévenus pour une même demande. */
const MAX_VOLONTAIRES = 200;

/** Prévient les membres volontaires de la ville (puis du pays si la ville est vide) d'un besoin publié. */
export async function notifyHelpVolunteers(contentId: string) {
  const c = await db.content.findUnique({
    where: { id: contentId, type: "HELP_REQUEST", status: "PUBLISHED" },
    select: { id: true, title: true, slug: true, excerpt: true, city: true, country: true, type: true, ownerProfile: { select: { userId: true, displayName: true } }, help: true },
  });
  if (!c || !c.help || c.help.kind !== "NEED") return 0;
  const ci = { mode: "insensitive" as const };
  const volontaires = await db.profile.findMany({
    where: {
      helpVolunteer: true,
      user: { status: "ACTIVE" },
      ...(c.ownerProfile && { userId: { not: c.ownerProfile.userId } }),
      ...(c.city ? { city: { equals: c.city, ...ci }, ...(c.country && { country: { equals: c.country, ...ci } }) } : c.country ? { country: { equals: c.country, ...ci } } : { id: "aucun" }),
    },
    select: { displayName: true, user: { select: { email: true } } },
    take: MAX_VOLONTAIRES,
  });
  const href = `${SITE_URL}${contentHref(c.type, c.slug)}`;
  const lieu = [c.city, c.country].filter(Boolean).join(", ");
  let envoyes = 0;
  for (const v of volontaires) {
    try {
      await sendHelpAlert(v.user.email, { prenom: v.displayName.split(" ")[0], title: c.title, excerpt: c.excerpt, category: c.help.category, urgent: c.help.urgent, lieu, href, auteur: c.ownerProfile?.displayName ?? "un membre" });
      envoyes++;
    } catch (e) {
      console.error("[entraide] alerte volontaire impossible", e);
    }
  }
  return envoyes;
}

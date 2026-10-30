"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { EXPERT_DOMAINS } from "@/lib/competences";
import { sendExpertRequest } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";

const schema = z.object({
  nom: z.string().trim().min(2, "nom").max(120, "nom"),
  organisation: z.string().trim().min(2, "organisation").max(160, "organisation"),
  email: z.email("email"),
  domaine: z.enum(EXPERT_DOMAINS, { error: "domaine" }),
  besoin: z.string().trim().min(40, "besoin").max(2000, "besoin"),
  consent: z.literal("on", { error: "consent" }),
  website: z.string().max(0, "spam").optional(),
});

export async function demandeExpertAction(formData: FormData) {
  const ip = await clientIp();
  if (!(await rateLimit(`expert-demande:${ip}`, 3, 3600))) redirect("/communaute/competences?erreur=trop#demande");
  if (!(await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip))) redirect("/communaute/competences?erreur=robot#demande");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/communaute/competences?erreur=${parsed.error.issues[0].message}#demande`);
  const d = parsed.data;
  try {
    await sendExpertRequest({ nom: d.nom, organisation: d.organisation, email: d.email.toLowerCase(), domaine: d.domaine, besoin: d.besoin });
  } catch (e) {
    console.error("[compétences] demande impossible", e);
    redirect("/communaute/competences?erreur=envoi#demande");
  }
  redirect("/communaute/competences?envoye=1#demande");
}

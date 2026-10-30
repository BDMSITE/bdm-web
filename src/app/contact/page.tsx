import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SiteHeader, SiteFooter, PageBanner } from "@/components/site/chrome";
import { sendContactMessage } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { turnstileSiteKey, verifyTurnstile } from "@/lib/turnstile";
import { Turnstile } from "@/components/site/turnstile";

export const metadata: Metadata = { title: "Contact" };

/* Formulaire de contact (CDC §7.12). Le message part par e-mail vers l'adresse
   de contact du HCBE (CONTACT_EMAIL) ; aucune adresse n'est affichée sur le site.
   Anti-spam honnête : un champ « site web » caché qui doit rester vide. */

const SUJETS = [
  "Question générale",
  "Question au HCBE",
  "Devenir annonceur / partenaire",
  "Recruteur",
  "Presse",
  "Signaler un problème sur le site",
  "Données personnelles",
] as const;

const schema = z.object({
  nom: z.string().trim().min(2, "nom").max(120, "nom"),
  email: z.email("email"),
  sujet: z.enum(SUJETS, { error: "sujet" }),
  message: z.string().trim().min(20, "message").max(5000, "message"),
  consent: z.literal("on", { error: "consent" }),
  website: z.string().max(0, "spam").optional(),
});

const ERREURS: Record<string, string> = {
  nom: "Indiquez votre nom.",
  email: "Adresse e-mail invalide.",
  sujet: "Choisissez un sujet.",
  message: "Votre message doit faire au moins 20 caractères.",
  consent: "Vous devez accepter le traitement de votre demande.",
  spam: "Le formulaire n'a pas pu être envoyé.",
  envoi: "Envoi impossible pour le moment. Réessayez dans quelques instants.",
  trop: "Trop de messages envoyés depuis votre connexion : réessayez dans une heure.",
  robot: "Vérification anti-robot échouée : rechargez la page et réessayez.",
};

async function contactAction(formData: FormData) {
  "use server";
  const ip = await clientIp();
  if (!(await rateLimit(`contact:${ip}`, 5, 3600))) redirect("/contact?erreur=trop");
  if (!(await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip))) redirect("/contact?erreur=robot");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/contact?erreur=${parsed.error.issues[0].message}`);
  const d = parsed.data;
  try {
    await sendContactMessage({ name: d.nom, email: d.email.toLowerCase() }, d.sujet, d.message);
  } catch (e) {
    console.error("[contact] envoi impossible", e);
    redirect("/contact?erreur=envoi");
  }
  redirect("/contact?envoye=1");
}

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ envoye?: string; erreur?: string; sujet?: string }> }) {
  const sp = await searchParams;
  const sujetInitial = SUJETS.find((s) => s === sp.sujet) ?? SUJETS[0];
  const erreur = sp.erreur ? ERREURS[sp.erreur] ?? ERREURS.envoi : null;

  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="Nous"
        em="écrire"
        desc="Une question, un partenariat, un problème sur le site : écrivez-nous par ce formulaire. Votre message est transmis à l'équipe de Béninois du Monde et du HCBE."
      />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          {sp.envoye ? (
            <div className="max-w-2xl border-2 border-primary bg-primary-faint p-6">
              <p className="font-display text-lg font-bold">Message envoyé</p>
              <p className="mt-1 text-sm text-ink-2">Merci, votre message a bien été transmis. Nous vous répondrons à l&apos;adresse indiquée.</p>
              <Link href="/" className="mt-4 inline-block whitespace-nowrap rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <form action={contactAction} className="max-w-2xl space-y-5 border border-line p-6">
              {erreur && (
                <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{erreur}</p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="nom" className="mb-1 block text-sm font-bold">Votre nom *</label>
                  <input id="nom" name="nom" required autoComplete="name" className={INPUT} />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-bold">Votre e-mail *</label>
                  <input id="email" name="email" type="email" required autoComplete="email" className={INPUT} />
                  <p className="mt-1 text-xs text-muted">Utilisé uniquement pour vous répondre.</p>
                </div>
              </div>
              <div>
                <label htmlFor="sujet" className="mb-1 block text-sm font-bold">Sujet *</label>
                <select id="sujet" name="sujet" defaultValue={sujetInitial} className={`${INPUT} sm:w-2/3`}>
                  {SUJETS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="message" className="mb-1 block text-sm font-bold">Votre message *</label>
                <textarea id="message" name="message" rows={6} required minLength={20} className={INPUT} />
              </div>
              {/* Anti-spam : champ invisible pour les humains, rempli par les robots */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="website">Site web</label>
                <input id="website" name="website" tabIndex={-1} autoComplete="off" />
              </div>
              <label className="flex items-start gap-2 text-xs text-ink-2">
                <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 accent-primary" />
                J&apos;accepte que mes informations soient utilisées pour traiter ma demande. *
              </label>
              <Turnstile siteKey={turnstileSiteKey} />
              <button type="submit" className="rounded bg-primary px-6 py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark">
                Envoyer
              </button>
              <p className="text-xs text-muted">
                Vos données ne servent qu&apos;à traiter votre demande — voir la{" "}
                <Link href="/legal/confidentialite" className="font-bold text-primary hover:underline">politique de confidentialité</Link>.
              </p>
            </form>
          )}

          <aside className="space-y-6">
            <div className="border-2 border-primary p-4 text-sm">
              <h3 className="section-title text-sm">Avant d&apos;écrire</h3>
              <ul className="mt-2 space-y-1.5 text-ink-2">
                <li>Pour joindre un membre : bouton « Écrire » sur son profil.</li>
                <li>Pour une offre d&apos;emploi : postulez depuis l&apos;offre.</li>
                <li>Pour un contenu problématique : bouton « Signaler » sur la page.</li>
              </ul>
            </div>
            <div className="border border-line bg-paper-2 p-4 text-sm">
              <h3 className="section-title text-sm">Attention aux <em>faux intermédiaires</em></h3>
              <p className="mt-2 text-ink-2">
                Le site ne demande jamais d&apos;argent pour une candidature ou une mise en relation.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

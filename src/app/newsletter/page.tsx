import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SiteHeader, SiteFooter, PageBanner } from "@/components/site/chrome";
import { db } from "@/lib/db";
import { sendNewsletterConfirm } from "@/lib/mail";
import { confirmLink } from "@/lib/newsletter";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { turnstileSiteKey, verifyTurnstile } from "@/lib/turnstile";
import { Turnstile } from "@/components/site/turnstile";

export const metadata: Metadata = {
  title: "La lettre de Béninois du Monde",
  description: "Chaque mois, l'essentiel de la diaspora béninoise : emploi, événements, bonnes adresses, bons plans. Gratuit, désinscription en un clic.",
};

/* Abonnement à la newsletter avec double confirmation : l'adresse n'est utilisée
   qu'après le clic sur le lien reçu. Désinscription en un clic depuis chaque lettre. */

const schema = z.object({
  email: z.email("email"),
  consent: z.literal("on", { error: "consent" }),
  website: z.string().max(0, "spam").optional(),
});

const ERREURS: Record<string, string> = {
  email: "Adresse e-mail invalide.",
  consent: "Vous devez accepter de recevoir la lettre.",
  spam: "Le formulaire n'a pas pu être envoyé.",
  envoi: "Envoi impossible pour le moment. Réessayez dans quelques instants.",
  trop: "Trop de demandes depuis votre connexion : réessayez dans une heure.",
  robot: "Vérification anti-robot échouée : rechargez la page et réessayez.",
  jeton: "Ce lien n'est plus valable : demandez un nouvel e-mail de confirmation.",
};

async function subscribeAction(formData: FormData) {
  "use server";
  const ip = await clientIp();
  if (!(await rateLimit(`newsletter:${ip}`, 5, 3600))) redirect("/newsletter?erreur=trop");
  if (!(await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip))) redirect("/newsletter?erreur=robot");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/newsletter?erreur=${parsed.error.issues[0].message}`);
  const email = parsed.data.email.toLowerCase();
  const existing = await db.subscriber.findUnique({ where: { email }, select: { confirmedAt: true } });
  if (existing?.confirmedAt) redirect("/newsletter?envoye=deja");
  await db.subscriber.upsert({ where: { email }, update: {}, create: { email } });
  try {
    await sendNewsletterConfirm(email, confirmLink(email));
  } catch (e) {
    console.error("[newsletter] confirmation impossible", e);
    redirect("/newsletter?erreur=envoi");
  }
  redirect("/newsletter?envoye=1");
}

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ envoye?: string; erreur?: string; confirme?: string; desinscrit?: string }> }) {
  const sp = await searchParams;
  const erreur = sp.erreur ? ERREURS[sp.erreur] ?? ERREURS.spam : null;
  const message = sp.confirme
    ? { t: "Adresse confirmée.", d: "Vous recevrez la prochaine lettre. Chaque numéro contient un lien de désinscription." }
    : sp.desinscrit
      ? { t: "Vous êtes désinscrit.", d: "Vous ne recevrez plus la lettre. Vous pouvez vous réabonner à tout moment ci-dessous." }
      : sp.envoye === "deja"
        ? { t: "Vous êtes déjà abonné.", d: "Cette adresse est déjà confirmée : rien à faire." }
        : sp.envoye
          ? { t: "Un e-mail vient de partir.", d: "Ouvrez-le et cliquez sur le bouton pour confirmer votre abonnement. Pensez à vérifier les courriers indésirables." }
          : null;

  return (
    <>
      <SiteHeader />
      <PageBanner
        pre="La lettre de"
        em="Béninois du Monde"
        desc="Chaque mois dans votre boîte : les offres d'emploi, les événements, les bonnes adresses et les bons plans de la diaspora. Gratuit, sans publicité intrusive, désinscription en un clic."
      />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            {message ? (
              <div className="rounded border border-primary bg-primary-faint p-6" role="status">
                <p className="text-lg font-bold text-primary-dark">{message.t}</p>
                <p className="mt-1 text-sm text-ink-2">{message.d}</p>
                {!sp.desinscrit && (
                  <Link href="/" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">Retour à l&apos;accueil →</Link>
                )}
              </div>
            ) : null}
            {(!message || sp.desinscrit) && (
              <form action={subscribeAction} className="mt-6 max-w-xl space-y-4">
                {erreur && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2 text-sm text-danger">{erreur}</p>}
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-bold">Votre e-mail *</label>
                  <input id="email" name="email" type="email" required autoComplete="email" className={INPUT} />
                </div>
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="website">Site web</label>
                  <input id="website" name="website" tabIndex={-1} autoComplete="off" />
                </div>
                <label className="flex items-start gap-2 text-xs text-ink-2">
                  <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 accent-primary" />
                  J&apos;accepte de recevoir la lettre de Béninois du Monde. Mon adresse n&apos;est utilisée que pour cet envoi. *
                </label>
                <Turnstile siteKey={turnstileSiteKey} />
                <button type="submit" className="rounded bg-primary px-6 py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark">
                  Je m&apos;abonne
                </button>
                <p className="text-xs text-muted">
                  Double confirmation : un e-mail vous demandera de valider l&apos;abonnement. Voir la{" "}
                  <Link href="/legal/confidentialite" className="font-bold text-primary hover:underline">politique de confidentialité</Link>.
                </p>
              </form>
            )}
          </section>
          <aside className="space-y-6 text-sm">
            <div className="rounded border border-line p-5">
              <p className="section-title">Au sommaire</p>
              <ul className="mt-3 space-y-2 text-ink-2">
                <li>Les offres d&apos;emploi et de stage de la communauté</li>
                <li>L&apos;agenda des événements, de Cotonou à Montréal</li>
                <li>Les nouvelles adresses et les bons plans partenaires</li>
                <li>Les articles du magazine et les lieux de mémoire</li>
              </ul>
            </div>
            <div className="rounded border border-line p-5">
              <p className="section-title">Membre du site ?</p>
              <p className="mt-2 text-ink-2">
                Les membres peuvent aussi créer des <Link href="/compte/alertes" className="font-bold text-primary hover:underline">alertes par mots-clés</Link> : un e-mail dès qu&apos;un contenu les concerne.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

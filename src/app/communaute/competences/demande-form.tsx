import Link from "next/link";
import { EXPERT_DOMAINS } from "@/lib/competences";
import { turnstileSiteKey } from "@/lib/turnstile";
import { Turnstile } from "@/components/site/turnstile";
import { demandeExpertAction } from "./demande-action";

/* « Je cherche un expert » : un porteur de projet au Bénin décrit son besoin ; la demande
   part par e-mail au HCBE qui fait le lien avec les experts validés. */

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function DemandeExpertForm({ erreur, envoye }: { erreur?: string | null; envoye?: boolean }) {
  if (envoye) {
    return (
      <div className="rounded border border-primary bg-primary-faint p-5 text-sm" role="status">
        <p className="font-bold text-primary-dark">Demande transmise au HCBE.</p>
        <p className="mt-1 text-ink-2">L&apos;équipe cherche parmi les experts validés et vous répond à l&apos;adresse indiquée.</p>
      </div>
    );
  }
  return (
    <form action={demandeExpertAction} className="space-y-4 border-2 border-primary p-5">
      {erreur && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2 text-sm text-danger">{erreur}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="d-nom" className="mb-1 block text-sm font-bold">Votre nom *</label>
          <input id="d-nom" name="nom" required maxLength={120} autoComplete="name" className={INPUT} />
        </div>
        <div>
          <label htmlFor="d-orga" className="mb-1 block text-sm font-bold">Organisation (institution, entreprise, association) *</label>
          <input id="d-orga" name="organisation" required maxLength={160} autoComplete="organization" className={INPUT} />
        </div>
        <div>
          <label htmlFor="d-email" className="mb-1 block text-sm font-bold">Votre e-mail *</label>
          <input id="d-email" name="email" type="email" required autoComplete="email" className={INPUT} />
        </div>
        <div>
          <label htmlFor="d-domaine" className="mb-1 block text-sm font-bold">Domaine recherché *</label>
          <select id="d-domaine" name="domaine" required className={INPUT}>
            <option value="">Choisir…</option>
            {EXPERT_DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="d-besoin" className="mb-1 block text-sm font-bold">Votre besoin *</label>
        <textarea id="d-besoin" name="besoin" rows={5} required minLength={40} maxLength={2000} placeholder="Le projet, le type d'expertise, la durée (mentorat, mission courte, conseil à distance), le calendrier." className={INPUT} />
      </div>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="d-website">Site web</label>
        <input id="d-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex items-start gap-2 text-xs text-ink-2">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 accent-primary" />
        J&apos;accepte que le HCBE utilise ces informations pour me mettre en relation avec des experts de la diaspora. *
      </label>
      <Turnstile siteKey={turnstileSiteKey} />
      <button type="submit" className="rounded bg-primary px-6 py-2.5 text-sm font-bold uppercase text-white hover:bg-primary-dark">Envoyer ma demande</button>
      <p className="text-xs text-muted">
        Vos données ne servent qu&apos;à cette mise en relation — voir la <Link href="/legal/confidentialite" className="font-bold text-primary hover:underline">politique de confidentialité</Link>.
      </p>
    </form>
  );
}

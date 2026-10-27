"use client";

import { useActionState, useState } from "react";
import type { Banner } from "@prisma/client";
import { createBannerAction, updateBannerAction, type RegieState } from "@/lib/actions/regie";
import { SLOTS } from "@/lib/pub-slots";

/* Formulaire de campagne (création / édition). Deux modèles par emplacement :
   « image » (visuel fourni, aux dimensions de l'emplacement) ou « carte »
   (logo + accroche + couleur, générée par le site, toujours nette). */

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none aria-[invalid=true]:border-danger";
const LABEL = "mb-1 block text-sm font-bold";
const STATUTS = [["DRAFT", "Brouillon"], ["IN_MODERATION", "À valider"], ["PUBLISHED", "En diffusion"], ["REJECTED", "Refusée"], ["ARCHIVED", "Archivée"]] as const;

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export function BannerForm({ banner }: { banner?: Banner }) {
  const [state, action, pending] = useActionState<RegieState, FormData>(banner ? updateBannerAction : createBannerAction, {});
  const [kind, setKind] = useState<"IMAGE" | "CARD">(banner?.kind ?? "CARD");
  const [slot, setSlot] = useState(banner?.slot ?? "SIDE");
  const invalid = (c: string) => (state.champ === c ? true : undefined);
  const spec = SLOTS.find((s) => s.code === slot)!;

  return (
    <form action={action} className="space-y-6">
      {banner && <input type="hidden" name="id" value={banner.id} />}
      {state.error && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2.5 text-sm text-primary-dark">{state.message}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className={LABEL}>Nom de la campagne *</label>
          <input id="title" name="title" required defaultValue={banner?.title} aria-invalid={invalid("title")} className={INPUT} placeholder="Ex. Wanilo Studio — automne 2026" />
        </div>
        <div>
          <label htmlFor="advertiser" className={LABEL}>Annonceur affiché *</label>
          <input id="advertiser" name="advertiser" required defaultValue={banner?.advertiser} aria-invalid={invalid("advertiser")} className={INPUT} />
        </div>
        <div>
          <label htmlFor="slot" className={LABEL}>Emplacement *</label>
          <select id="slot" name="slot" value={slot} onChange={(e) => setSlot(e.target.value as typeof slot)} className={INPUT}>
            {SLOTS.map((s) => <option key={s.code} value={s.code}>{s.label} — {s.desktop.w}×{s.desktop.h}</option>)}
          </select>
          <p className="mt-1 text-xs text-muted">{spec.where} Mobile : {spec.mobile.w}×{spec.mobile.h}.</p>
        </div>
        <div>
          <label htmlFor="link" className={LABEL}>Lien de destination *</label>
          <input id="link" name="link" type="url" required defaultValue={banner?.link} aria-invalid={invalid("link")} className={INPUT} placeholder="https://" />
        </div>
      </div>

      <fieldset className="border border-line p-4">
        <legend className="px-1 text-sm font-bold">Modèle</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="kind" value="CARD" checked={kind === "CARD"} onChange={() => setKind("CARD")} className="accent-primary" /> Carte générée (logo + accroche + couleur)</label>
          <label className="flex items-center gap-2"><input type="radio" name="kind" value="IMAGE" checked={kind === "IMAGE"} onChange={() => setKind("IMAGE")} className="accent-primary" /> Visuel fourni ({spec.desktop.w}×{spec.desktop.h})</label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="imageFile" className={LABEL}>{kind === "CARD" ? "Logo (PNG/SVG fond transparent)" : `Visuel bureau ${spec.desktop.w}×${spec.desktop.h}`}</label>
            <input id="imageFile" name="imageFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white" />
            <input name="image" type="url" defaultValue={banner?.image ?? ""} aria-invalid={invalid("image")} className={`${INPUT} mt-2`} placeholder="…ou adresse de l'image en ligne (https://)" />
            {banner?.image && <p className="mt-1 truncate text-xs text-muted">Actuel : {banner.image}</p>}
          </div>
          {kind === "IMAGE" ? (
            <div>
              <label htmlFor="imageMobileFile" className={LABEL}>Visuel mobile {spec.mobile.w}×{spec.mobile.h} (facultatif)</label>
              <input id="imageMobileFile" name="imageMobileFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white" />
              <input name="imageMobile" type="url" defaultValue={banner?.imageMobile ?? ""} className={`${INPUT} mt-2`} placeholder="…ou adresse de l'image mobile" />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="headline" className={LABEL}>Titre de la carte</label>
                <input id="headline" name="headline" defaultValue={banner?.headline ?? ""} maxLength={80} className={INPUT} placeholder="Par défaut : le nom de l'annonceur" />
              </div>
              <div>
                <label htmlFor="tagline" className={LABEL}>Accroche</label>
                <input id="tagline" name="tagline" defaultValue={banner?.tagline ?? ""} maxLength={160} className={INPUT} placeholder="Une phrase courte" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-bold">Fond <input name="bg" type="color" defaultValue={banner?.bg ?? "#0b3d2e"} className="h-8 w-12 cursor-pointer border border-line" /></label>
                <label className="flex items-center gap-2 text-sm font-bold">Texte <input name="fg" type="color" defaultValue={banner?.fg ?? "#ffffff"} className="h-8 w-12 cursor-pointer border border-line" /></label>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4">
          <label htmlFor="alt" className={LABEL}>Texte alternatif * <span className="font-normal text-muted">(lu par les lecteurs d&apos;écran)</span></label>
          <input id="alt" name="alt" required defaultValue={banner?.alt} aria-invalid={invalid("alt")} className={INPUT} placeholder="Ex. Wanilo Studio, studio podcast et vidéo à Cotonou" />
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="startsAt" className={LABEL}>Début *</label>
          <input id="startsAt" name="startsAt" type="date" required defaultValue={iso(banner?.startsAt) || iso(new Date())} aria-invalid={invalid("startsAt")} className={INPUT} />
        </div>
        <div>
          <label htmlFor="endsAt" className={LABEL}>Fin <span className="font-normal text-muted">(vide = sans fin)</span></label>
          <input id="endsAt" name="endsAt" type="date" defaultValue={iso(banner?.endsAt)} aria-invalid={invalid("endsAt")} className={INPUT} />
        </div>
        <div>
          <label htmlFor="weight" className={LABEL}>Poids de rotation (1-10)</label>
          <input id="weight" name="weight" type="number" min={1} max={10} defaultValue={banner?.weight ?? 1} className={INPUT} />
        </div>
        <div>
          <label htmlFor="status" className={LABEL}>Statut</label>
          <select id="status" name="status" defaultValue={banner?.status ?? "DRAFT"} className={INPUT}>
            {STATUTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <details className="border border-line p-4 text-sm">
        <summary className="cursor-pointer font-bold">Ciblage et campagne maison</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sections" className={LABEL}>Rubriques ciblées</label>
            <input id="sections" name="sections" defaultValue={banner?.sections.join(", ") ?? ""} className={INPUT} placeholder="emploi, agenda, adresses… (vide = toutes)" />
          </div>
          <div>
            <label htmlFor="countries" className={LABEL}>Pays du lecteur</label>
            <input id="countries" name="countries" defaultValue={banner?.countries.join(", ") ?? ""} className={INPUT} placeholder="france, canada… (vide = tous) — bientôt" />
          </div>
        </div>
        <label className="mt-3 flex items-start gap-2">
          <input type="checkbox" name="house" defaultChecked={banner?.house ?? false} className="mt-0.5 accent-primary" />
          <span><strong>Campagne maison</strong> : diffusée seulement quand aucune campagne vendue n&apos;est active sur l&apos;emplacement (sites du groupe, promotion interne).</span>
        </label>
      </details>

      <div className="flex gap-3 border-t border-line pt-4">
        <button type="submit" disabled={pending} className="rounded bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Enregistrement…" : banner ? "Enregistrer" : "Créer la campagne"}
        </button>
      </div>
    </form>
  );
}

export function NewBannerPanel() {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
        Nouvelle campagne
      </button>
    );
  }
  return (
    <div className="w-full space-y-4 rounded border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">Nouvelle campagne</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold uppercase text-ink-2 hover:text-primary">Fermer</button>
      </div>
      <BannerForm />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Banner } from "@prisma/client";
import { createMyBannerAction, updateMyBannerAction, withdrawMyBannerAction, type PubState } from "@/lib/actions/publicite";
import { SLOTS } from "@/lib/pub-slots";

/* Formulaire annonceur (libre-service) : emplacement, modèle carte ou visuel,
   lien, période souhaitée. Pas de statut : tout part en validation. */

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none aria-[invalid=true]:border-danger";
const LABEL = "mb-1 block text-sm font-bold";
const FILE = "block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white";
const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export function PubForm({ banner, uploadEnabled }: { banner?: Banner; uploadEnabled: boolean }) {
  const [state, action, pending] = useActionState<PubState, FormData>(banner ? updateMyBannerAction : createMyBannerAction, {});
  const [kind, setKind] = useState<"IMAGE" | "CARD">(banner?.kind ?? "CARD");
  const [slot, setSlot] = useState(banner?.slot ?? "SIDE");
  const invalid = (c: string) => (state.champ === c ? true : undefined);
  const spec = SLOTS.find((s) => s.code === slot)!;

  if (state.ok) {
    return (
      <div className="border-2 border-primary bg-primary-faint p-6">
        <p className="font-display text-lg font-bold">Campagne envoyée à la régie</p>
        <p className="mt-1 text-sm text-ink-2">
          Nous revenons vers vous avec le tarif et la date de mise en ligne. Vous pouvez suivre son état dans cette page.
        </p>
        <Link href="/compte/publicite" className="mt-4 inline-block rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">Mes campagnes</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      {banner && <input type="hidden" name="id" value={banner.id} />}
      {state.error && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2.5 text-sm text-danger">{state.error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className={LABEL}>Nom de la campagne *</label>
          <input id="title" name="title" required defaultValue={banner?.title} aria-invalid={invalid("title")} className={INPUT} placeholder="Ex. Lancement de ma boutique" />
        </div>
        <div>
          <label htmlFor="link" className={LABEL}>Lien de destination *</label>
          <input id="link" name="link" type="url" required defaultValue={banner?.link} aria-invalid={invalid("link")} className={INPUT} placeholder="https://" />
        </div>
      </div>

      <fieldset className="border border-line p-4">
        <legend className="px-1 text-sm font-bold">Emplacement</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {SLOTS.map((s) => (
            <label key={s.code} className={`cursor-pointer rounded border p-3 text-sm ${slot === s.code ? "border-2 border-primary bg-primary-faint" : "border-line hover:border-primary"}`}>
              <input type="radio" name="slot" value={s.code} checked={slot === s.code} onChange={() => setSlot(s.code)} className="sr-only" />
              <span className="block font-bold">{s.label}</span>
              <span className="block text-xs text-muted">{s.desktop.w}×{s.desktop.h} px · {s.where}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border border-line p-4">
        <legend className="px-1 text-sm font-bold">Modèle</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="kind" value="CARD" checked={kind === "CARD"} onChange={() => setKind("CARD")} className="accent-primary" /> Carte à mes couleurs (logo + accroche + photo)</label>
          <label className="flex items-center gap-2"><input type="radio" name="kind" value="IMAGE" checked={kind === "IMAGE"} onChange={() => setKind("IMAGE")} className="accent-primary" /> Mon propre visuel ({spec.desktop.w}×{spec.desktop.h})</label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="imageFile" className={LABEL}>{kind === "CARD" ? "Logo (PNG fond transparent)" : `Visuel ${spec.desktop.w}×${spec.desktop.h}`}</label>
            {uploadEnabled && <input id="imageFile" name="imageFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className={FILE} />}
            <input name="image" type="url" defaultValue={banner?.image ?? ""} aria-invalid={invalid("image")} className={`${INPUT} mt-2`} placeholder={uploadEnabled ? "…ou adresse de l'image en ligne" : "Adresse de l'image en ligne (https://)"} />
          </div>
          {kind === "CARD" && (
            <div className="space-y-3">
              <div>
                <label htmlFor="headline" className={LABEL}>Titre de la carte</label>
                <input id="headline" name="headline" defaultValue={banner?.headline ?? ""} maxLength={80} className={INPUT} placeholder="Par défaut : votre nom" />
              </div>
              <div>
                <label htmlFor="tagline" className={LABEL}>Accroche (une phrase)</label>
                <input id="tagline" name="tagline" defaultValue={banner?.tagline ?? ""} maxLength={160} className={INPUT} />
              </div>
              <div>
                <label htmlFor="photoFile" className={LABEL}>Photo d&apos;ambiance (facultative)</label>
                {uploadEnabled && <input id="photoFile" name="photoFile" type="file" accept="image/png,image/jpeg,image/webp" className={FILE} />}
                <input name="photo" type="url" defaultValue={banner?.photo ?? ""} className={`${INPUT} mt-2`} placeholder="…ou adresse d'une photo en ligne" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-bold">Fond <input name="bg" type="color" defaultValue={banner?.bg ?? "#0b3d2e"} className="h-8 w-12 cursor-pointer border border-line" /></label>
                <label className="flex items-center gap-2 text-sm font-bold">Texte <input name="fg" type="color" defaultValue={banner?.fg ?? "#ffffff"} className="h-8 w-12 cursor-pointer border border-line" /></label>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4">
          <label htmlFor="alt" className={LABEL}>Décrivez votre publicité en une phrase * <span className="font-normal text-muted">(accessibilité)</span></label>
          <input id="alt" name="alt" required defaultValue={banner?.alt} aria-invalid={invalid("alt")} className={INPUT} placeholder="Ex. Boutique Afrik'Mode, prêt-à-porter wax à Paris" />
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startsAt" className={LABEL}>Début souhaité *</label>
          <input id="startsAt" name="startsAt" type="date" required defaultValue={iso(banner?.startsAt) || iso(new Date())} aria-invalid={invalid("startsAt")} className={INPUT} />
        </div>
        <div>
          <label htmlFor="endsAt" className={LABEL}>Fin souhaitée <span className="font-normal text-muted">(vide = à définir avec la régie)</span></label>
          <input id="endsAt" name="endsAt" type="date" defaultValue={iso(banner?.endsAt)} aria-invalid={invalid("endsAt")} className={INPUT} />
        </div>
      </div>

      <p className="text-xs text-muted">
        Après envoi, la régie vous communique le tarif et valide la campagne avant diffusion. Les secteurs sensibles sont soumis à l&apos;accord du HCBE.
      </p>
      <div className="flex flex-wrap gap-3 border-t border-line pt-4">
        <button type="submit" disabled={pending} className="rounded bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Envoi…" : banner ? "Enregistrer et renvoyer en validation" : "Envoyer à la régie"}
        </button>
        {banner && banner.status !== "ARCHIVED" && (
          <button type="submit" formAction={withdrawMyBannerAction} formNoValidate disabled={pending} className="rounded border-2 border-line px-5 py-2.5 text-sm font-bold text-ink-2 hover:border-danger hover:text-danger disabled:opacity-60">
            Retirer la campagne
          </button>
        )}
      </div>
    </form>
  );
}

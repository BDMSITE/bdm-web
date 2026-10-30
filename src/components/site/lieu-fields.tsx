"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PAYS, PAYS_FREQUENTS } from "@/lib/pays";

/* Champs Pays + Ville avec suggestions : pays depuis le référentiel (les plus fréquents
   d'abord), villes depuis Nominatim (OpenStreetMap, gratuit) filtrées par le pays saisi.
   Saisie libre toujours possible : les suggestions aident, elles n'imposent rien. */

type Props = {
  countryName?: string;
  cityName?: string;
  country?: string;
  city?: string;
  required?: boolean;
  countryInvalid?: boolean;
  cityInvalid?: boolean;
  countryLabel?: string;
  cityLabel?: string;
  cityHint?: string;
  inputClass: string;
  labelClass?: string;
};

export function LieuFields({
  countryName = "country",
  cityName = "city",
  country = "",
  city = "",
  required = false,
  countryInvalid,
  cityInvalid,
  countryLabel = "Pays",
  cityLabel = "Ville",
  cityHint,
  inputClass,
  labelClass = "mb-1 block text-sm font-bold",
}: Props) {
  const uid = useId();
  const [pays, setPays] = useState(country);
  const [ville, setVille] = useState(city);
  const [villes, setVilles] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = ville.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    timer.current = setTimeout(async () => {
      try {
        const p = new URLSearchParams({ format: "jsonv2", city: q, limit: "6", addressdetails: "1", "accept-language": "fr" });
        if (pays.trim()) p.set("country", pays.trim());
        const r = await fetch(`https://nominatim.openstreetmap.org/search?${p.toString()}`, { signal: ctrl.signal });
        if (!r.ok) return;
        const hits = (await r.json()) as { name?: string; address?: { city?: string; town?: string; village?: string; municipality?: string } }[];
        const noms = [...new Set(hits.map((h) => h.address?.city ?? h.address?.town ?? h.address?.village ?? h.address?.municipality ?? h.name ?? "").filter(Boolean))];
        setVilles(noms);
      } catch {
        /* hors ligne ou annulé : pas de suggestion */
      }
    }, 400);
    return () => {
      ctrl.abort();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [ville, pays]);

  const suggestionsPays = [...PAYS_FREQUENTS, ...PAYS.filter((p) => !PAYS_FREQUENTS.includes(p))];
  const idPays = `${uid}-pays`;
  const idVille = `${uid}-ville`;

  return (
    <>
      <div>
        <label htmlFor={`${uid}-country`} className={labelClass}>{countryLabel}{required ? " *" : ""}</label>
        <input
          id={`${uid}-country`}
          name={countryName}
          list={idPays}
          value={pays}
          onChange={(e) => setPays(e.target.value)}
          required={required}
          maxLength={80}
          autoComplete="country-name"
          aria-invalid={countryInvalid}
          className={inputClass}
        />
        <datalist id={idPays}>
          {suggestionsPays.map((p) => <option key={p} value={p} />)}
        </datalist>
      </div>
      <div>
        <label htmlFor={`${uid}-city`} className={labelClass}>{cityLabel}{required ? " *" : ""}</label>
        <input
          id={`${uid}-city`}
          name={cityName}
          list={idVille}
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          required={required}
          maxLength={80}
          autoComplete="address-level2"
          aria-invalid={cityInvalid}
          className={inputClass}
        />
        <datalist id={idVille}>
          {villes.map((v) => <option key={v} value={v} />)}
        </datalist>
        {cityHint && <p className="mt-1 text-xs text-muted">{cityHint}</p>}
      </div>
    </>
  );
}

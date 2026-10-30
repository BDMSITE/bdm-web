"use client";

import { useEffect, useRef } from "react";
import { TIMEZONES, DEFAULT_TZ } from "@/lib/temps";

/* Sélecteur de fuseau horaire : préréglé sur le fuseau du navigateur quand aucune valeur
   n'est enregistrée (un membre à Montréal saisit l'heure de Montréal sans y penser). */

export function TimezoneSelect({ value, className, id = "timezone" }: { value?: string; className?: string; id?: string }) {
  const ref = useRef<HTMLSelectElement>(null);
  const initial = value || DEFAULT_TZ;
  const connu = TIMEZONES.some((t) => t.id === initial);
  useEffect(() => {
    if (value || !ref.current) return;
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (local && TIMEZONES.some((t) => t.id === local)) ref.current.value = local;
  }, [value]);
  return (
    <select ref={ref} id={id} name="timezone" defaultValue={initial} className={className}>
      {!connu && <option value={initial}>{initial}</option>}
      {TIMEZONES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
    </select>
  );
}

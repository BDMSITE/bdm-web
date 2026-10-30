"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapData, MapPoint } from "@/lib/content";

/* Bande « carte de la diaspora » — carte interactive MapLibre + OpenStreetMap : filtres
   par thème sur la carte (membres, afrodescendants, associations, bonnes adresses,
   événements), pastilles de comptage pour les villes, épingles cliquables pour les
   contenus. Ouverte par défaut sur l'accueil, repliée ailleurs. Données réelles (props). */

const THEMES: { key: keyof MapData; label: string; pin?: boolean }[] = [
  { key: "membres", label: "Membres" },
  { key: "afrodescendants", label: "Afrodescendants" },
  { key: "associations", label: "Associations" },
  { key: "adresses", label: "Bonnes adresses", pin: true },
  { key: "evenements", label: "Événements", pin: true },
];

export function MapBand({ defaultOpen = false, data, membres, pays }: { defaultOpen?: boolean; data: MapData; membres: number; pays: number }) {
  const [open, setOpen] = useState(defaultOpen);
  const [actifs, setActifs] = useState<Set<keyof MapData>>(() => new Set(["membres"]));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  /* Création de la carte à l'ouverture. */
  useEffect(() => {
    if (!open || !containerRef.current || mapRef.current) return;
    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap" } },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        bounds: [[-82, -8], [118, 55]],
        fitBoundsOptions: { padding: { top: 30, bottom: 30, left: 70, right: 70 } },
        minZoom: 0.8,
        maxZoom: 12,
        attributionControl: { compact: true },
      });
      map.scrollZoom.disable();
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;
    } catch {
      // WebGL indisponible : le fond du conteneur sert de repli, sans planter la page.
      return;
    }
    return () => {
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [open]);

  /* Marqueurs : reconstruits à chaque changement de thème. */
  useEffect(() => {
    const map = mapRef.current;
    if (!open || !map) return;
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];
    for (const t of THEMES) {
      if (!actifs.has(t.key)) continue;
      const points: MapPoint[] = data[t.key];
      const max = Math.max(1, ...points.map((v) => v.n));
      for (const v of points) {
        let el: HTMLElement;
        if (t.pin) {
          const a = document.createElement("a");
          a.href = v.href ?? "#";
          a.className = `bdm-pin bdm-pin-${t.key}`;
          a.title = v.name;
          a.setAttribute("aria-label", `${t.label} : ${v.name}`);
          el = a;
        } else {
          const b = document.createElement("a");
          b.href = v.href ?? "#";
          b.className = `bdm-ball bdm-ball-${t.key}${v.n >= max / 2 && v.n > 1 ? " bdm-ball-big" : ""}`;
          b.textContent = String(v.n);
          b.title = `${v.name} — ${v.n} ${t.label.toLowerCase()}`;
          b.setAttribute("aria-label", `${v.n} ${t.label.toLowerCase()} à ${v.name}`);
          el = b;
        }
        markersRef.current.push(new maplibregl.Marker({ element: el, anchor: t.pin ? "bottom" : "center" }).setLngLat([v.lng, v.lat]).addTo(map));
      }
    }
  }, [open, actifs, data]);

  const toggle = (k: keyof MapData) =>
    setActifs((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <section id="carte" aria-label="Carte de la diaspora">
      {!open && (
        <div className="flex justify-center">
          <button
            onClick={() => setOpen(true)}
            aria-expanded={false}
            className="flex items-center gap-2 rounded-b-lg border border-t-0 border-line bg-paper px-5 py-2.5 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-primary shadow-md hover:text-primary-dark"
          >
            <ChevronDown aria-hidden className="h-4 w-4" strokeWidth={2.5} />
            Déplier la carte
          </button>
        </div>
      )}

      {open && (
        <div className="border-b border-line">
          <div className="relative">
            <div ref={containerRef} className="h-[420px] w-full bg-[#dfe9e2]" />

            <div className="absolute left-4 top-4 z-10 w-[240px] space-y-4 sm:w-[260px]">
              <form action="/recherche" className="flex items-center gap-2 bg-paper px-3 shadow-md">
                <Search aria-hidden className="h-4 w-4 shrink-0 text-muted" />
                <input type="search" name="q" aria-label="Rechercher un pays, une région ou une ville" placeholder="Pays, région ou ville" className="h-11 w-full bg-transparent text-sm focus:outline-none" />
              </form>

              <div className="hidden bg-paper p-4 shadow-md sm:block">
                <p className="text-sm font-bold">Afficher sur la carte</p>
                <div className="mt-2.5 space-y-2">
                  {THEMES.map((t) => (
                    <label key={t.key} className="flex items-center gap-2.5 text-sm text-ink-2">
                      <input type="checkbox" checked={actifs.has(t.key)} onChange={() => toggle(t.key)} className="h-4 w-4 accent-primary" />
                      <span className="flex-1">{t.label}</span>
                      <span className="text-xs tabular-nums text-muted">{data[t.key].reduce((s, p) => s + p.n, 0)}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 border-t border-line pt-2.5 text-xs font-bold text-muted">
                  {membres.toLocaleString("fr-FR")} membre{membres > 1 ? "s" : ""} · <span className="text-primary">{pays} pays</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setOpen(false)}
              aria-expanded
              className="flex items-center gap-2 whitespace-nowrap rounded-b-lg border border-t-0 border-line bg-paper px-5 py-2.5 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-primary shadow-md hover:text-primary-dark"
            >
              <ChevronUp aria-hidden className="h-4 w-4" strokeWidth={2.5} />
              Replier la carte
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

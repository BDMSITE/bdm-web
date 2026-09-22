"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* Bande « carte de la diaspora » — vraie carte interactive MapLibre + OpenStreetMap,
   façon site modèle : filtres flottants sur la carte, clusters ronds, bouton
   replier/déplier centré. Ouverte par défaut sur l'accueil, repliée ailleurs.
   Les compteurs par ville sont des données d'exemple (branchés à la base en S5). */

const VILLES: { name: string; n: number; lng: number; lat: number; big?: boolean }[] = [
  { name: "Cotonou", n: 312, lng: 2.39, lat: 6.37, big: true },
  { name: "Paris", n: 214, lng: 2.35, lat: 48.85, big: true },
  { name: "Bruxelles", n: 96, lng: 4.35, lat: 50.85 },
  { name: "Marseille", n: 71, lng: 5.37, lat: 43.3 },
  { name: "Montréal", n: 88, lng: -73.57, lat: 45.5 },
  { name: "New York", n: 64, lng: -74.01, lat: 40.71 },
  { name: "Abidjan", n: 57, lng: -4.02, lat: 5.35 },
  { name: "Dakar", n: 43, lng: -17.47, lat: 14.72 },
  { name: "Lomé", n: 39, lng: 1.22, lat: 6.13 },
  { name: "Lagos", n: 52, lng: 3.38, lat: 6.52 },
  { name: "Libreville", n: 18, lng: 9.44, lat: 0.42 },
  { name: "Canton", n: 22, lng: 113.26, lat: 23.13 },
];

const THEMES = ["Membres", "Associations", "Bonnes adresses", "Événements"];

export function MapBand({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!open || !containerRef.current || mapRef.current) return;

    let map: maplibregl.Map;
    try {
        map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        bounds: [
          [-82, -8],
          [118, 55],
        ],
        fitBoundsOptions: { padding: { top: 30, bottom: 30, left: 70, right: 70 } },
        minZoom: 0.8,
        maxZoom: 12,
        attributionControl: { compact: true },
      });

      // Navigation au clic sur +/- ; pas de zoom à la molette (la page doit défiler)
      map.scrollZoom.disable();
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      for (const v of VILLES) {
        const el = document.createElement("button");
        el.className = v.big ? "bdm-ball bdm-ball-big" : "bdm-ball";
        el.textContent = String(v.n);
        el.title = `${v.name} — ${v.n} membres`;
        el.setAttribute("aria-label", `${v.n} membres à ${v.name}`);
        new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([v.lng, v.lat])
          .addTo(map);
      }

      mapRef.current = map;
    } catch {
      // WebGL indisponible (navigateur ancien, capture headless) : le fond
      // stylisé du conteneur sert de carte de repli, sans planter la page.
      return;
    }
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [open]);

  return (
    <section aria-label="Carte de la diaspora">
      {/* Repliée : onglet suspendu centré sous la navigation, façon modèle */}
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
        <div className="relative border-b border-line">
          <div ref={containerRef} className="h-[420px] w-full bg-[#dfe9e2]" />

          {/* Filtres flottants sur la carte, façon modèle */}
          <div className="absolute left-4 top-4 z-10 w-[240px] space-y-4 sm:w-[260px]">
            <form
              action="/recherche"
              className="flex items-center gap-2 bg-paper px-3 shadow-md"
            >
              <Search aria-hidden className="h-4 w-4 shrink-0 text-muted" />
              <input
                type="search"
                name="q"
                placeholder="Pays, région ou ville"
                className="h-11 w-full bg-transparent text-sm focus:outline-none"
              />
            </form>

            <div className="hidden bg-paper p-4 shadow-md sm:block">
              <p className="text-sm font-bold">Recherche par thème</p>
              <div className="mt-2.5 space-y-2">
                {THEMES.map((t) => (
                  <label key={t} className="flex items-center gap-2.5 text-sm text-ink-2">
                    <input
                      type="checkbox"
                      defaultChecked={t === "Membres"}
                      className="h-4 w-4 accent-primary"
                    />
                    {t}
                  </label>
                ))}
              </div>
              <p className="mt-3 border-t border-line pt-2.5 text-xs font-bold text-muted">
                1 254 membres · <span className="text-primary">47 pays</span>
              </p>
            </div>
          </div>

          {/* Bouton replier flottant, centré en bas de la carte */}
          <button
            onClick={() => setOpen(false)}
            aria-expanded
            className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md bg-paper px-5 py-2.5 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-primary shadow-lg hover:text-primary-dark"
          >
            <ChevronUp aria-hidden className="h-4 w-4" strokeWidth={2.5} />
            Replier la carte
          </button>
        </div>
      )}
    </section>
  );
}

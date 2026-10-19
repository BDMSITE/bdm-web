"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* Bande « carte de la diaspora » — vraie carte interactive MapLibre + OpenStreetMap,
   façon site modèle : filtres flottants sur la carte, clusters ronds, bouton
   replier/déplier centré. Ouverte par défaut sur l'accueil, repliée ailleurs.
   Villes et compteurs viennent des profils actifs géolocalisés (props). */

export type Ville = { name: string; n: number; lng: number; lat: number };

const THEMES = ["Membres", "Afrodescendants", "Associations", "Bonnes adresses", "Événements"];

export function MapBand({ defaultOpen = false, villes, membres, pays }: { defaultOpen?: boolean; villes: Ville[]; membres: number; pays: number }) {
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

      const max = Math.max(1, ...villes.map((v) => v.n));
      for (const v of villes) {
        const el = document.createElement("button");
        el.className = v.n >= max / 2 && v.n > 1 ? "bdm-ball bdm-ball-big" : "bdm-ball";
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
  }, [open, villes]);

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
        <div className="border-b border-line">
          <div className="relative">
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
                {membres.toLocaleString("fr-FR")} membre{membres > 1 ? "s" : ""} · <span className="text-primary">{pays} pays</span>
              </p>
            </div>
          </div>

          </div>

          {/* Onglet replier suspendu sous la carte, symétrique de l'ouvreur */}
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

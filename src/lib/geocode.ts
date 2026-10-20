/* Géocodage ville + pays → latitude/longitude via Nominatim (OpenStreetMap,
   gratuit, 1 requête/seconde, User-Agent obligatoire). Utilisé par le script
   de rattrapage et à l'enregistrement d'un profil. Échec = null, jamais d'erreur. */

export async function geocode(city: string | null | undefined, country: string | null | undefined): Promise<{ lat: number; lng: number } | null> {
  const q = [city, country].filter(Boolean).join(", ");
  if (!q) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { "User-Agent": "beninoisdumonde.org (contact via le site)", "Accept-Language": "fr" }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const hits = (await r.json()) as { lat: string; lon: string }[];
    if (!hits[0]) return null;
    return { lat: Number(hits[0].lat), lng: Number(hits[0].lon) };
  } catch {
    return null;
  }
}

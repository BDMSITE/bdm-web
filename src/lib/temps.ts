/* Fuseaux horaires des événements : l'heure saisie est celle du lieu, stockée en UTC,
   affichée dans le fuseau de l'événement et, en plus, à l'heure de Cotonou.
   Aucune dépendance : tout passe par Intl. */

export const DEFAULT_TZ = "Africa/Porto-Novo";

export const TIMEZONES: { id: string; label: string }[] = [
  { id: "Africa/Porto-Novo", label: "Bénin (Cotonou)" },
  { id: "Europe/Paris", label: "France (Paris)" },
  { id: "Europe/Brussels", label: "Belgique (Bruxelles)" },
  { id: "Europe/Zurich", label: "Suisse (Genève)" },
  { id: "Europe/London", label: "Royaume-Uni (Londres)" },
  { id: "Europe/Berlin", label: "Allemagne (Berlin)" },
  { id: "Europe/Madrid", label: "Espagne (Madrid)" },
  { id: "Europe/Rome", label: "Italie (Rome)" },
  { id: "America/Toronto", label: "Canada Est (Montréal, Toronto)" },
  { id: "America/Vancouver", label: "Canada Ouest (Vancouver)" },
  { id: "America/New_York", label: "États-Unis Est (New York, Washington)" },
  { id: "America/Chicago", label: "États-Unis Centre (Chicago, Houston)" },
  { id: "America/Los_Angeles", label: "États-Unis Ouest (Los Angeles)" },
  { id: "America/Sao_Paulo", label: "Brésil (São Paulo)" },
  { id: "Africa/Abidjan", label: "Côte d'Ivoire (Abidjan)" },
  { id: "Africa/Lome", label: "Togo (Lomé)" },
  { id: "Africa/Dakar", label: "Sénégal (Dakar)" },
  { id: "Africa/Lagos", label: "Nigeria (Lagos)" },
  { id: "Africa/Libreville", label: "Gabon (Libreville)" },
  { id: "Africa/Douala", label: "Cameroun (Douala)" },
  { id: "Africa/Casablanca", label: "Maroc (Casablanca)" },
  { id: "Africa/Johannesburg", label: "Afrique du Sud (Johannesburg)" },
  { id: "Asia/Dubai", label: "Émirats (Dubaï)" },
  { id: "Asia/Shanghai", label: "Chine (Pékin, Shanghai)" },
];

export function isTimezone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz) return false;
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function tzLabel(tz: string) {
  return TIMEZONES.find((t) => t.id === tz)?.label ?? tz.replace(/_/g, " ").split("/").pop() ?? tz;
}

function parts(date: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const o: Record<string, number> = {};
  for (const p of f.formatToParts(date)) if (p.type !== "literal") o[p.type] = Number(p.value);
  return o;
}

/** Décalage (ms) entre l'heure murale du fuseau et l'UTC, à l'instant donné. */
function offsetMs(date: Date, tz: string) {
  const p = parts(date, tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime();
}

/** « AAAA-MM-JJTHH:mm » saisi dans un fuseau → instant UTC. */
export function zonedToUtc(local: string, tz: string): Date {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return new Date(NaN);
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let guess = naive - offsetMs(new Date(naive), tz);
  guess = naive - offsetMs(new Date(guess), tz); // seconde passe autour des changements d'heure
  return new Date(guess);
}

/** Instant UTC → valeur d'un champ datetime-local dans le fuseau. */
export function utcToLocalInput(date: Date | null | undefined, tz: string): string {
  if (!date) return "";
  const p = parts(date, tz);
  const z = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${z(p.month)}-${z(p.day)}T${z(p.hour)}:${z(p.minute)}`;
}

const LONG: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" };
const SHORT: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };

/** Date d'événement dans son fuseau, avec le nom du lieu horaire. */
export function fmtEventDate(date: Date, tz: string, style: "long" | "short" = "long") {
  const safe = isTimezone(tz) ? tz : DEFAULT_TZ;
  return `${date.toLocaleDateString("fr-FR", { ...(style === "long" ? LONG : SHORT), timeZone: safe })} (${tzLabel(safe)})`;
}

/** Complément « · 18:00 à Cotonou » quand l'événement n'est pas au Bénin. */
export function fmtCotonou(date: Date, tz: string) {
  if (!isTimezone(tz) || tz === DEFAULT_TZ) return "";
  const heure = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: DEFAULT_TZ });
  const memeJour = utcToLocalInput(date, tz).slice(0, 10) === utcToLocalInput(date, DEFAULT_TZ).slice(0, 10);
  return memeJour ? `${heure} à Cotonou` : `${date.toLocaleDateString("fr-FR", { ...SHORT, timeZone: DEFAULT_TZ })} à Cotonou`;
}

/* ---------- iCal ---------- */

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);

export type IcsEvent = { uid: string; title: string; description?: string; location?: string; url: string; startsAt: Date; endsAt?: Date | null; updatedAt: Date };

export function buildIcs(events: IcsEvent[], calName = "Béninois du Monde") {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Beninois du Monde//Agenda//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icsText(calName)}`];
  for (const e of events) {
    const end = e.endsAt ?? new Date(e.startsAt.getTime() + 2 * 3600 * 1000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${icsDate(e.updatedAt)}`,
      `DTSTART:${icsDate(e.startsAt)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${icsText(e.title)}`,
      ...(e.description ? [`DESCRIPTION:${icsText(e.description.slice(0, 1000))}`] : []),
      ...(e.location ? [`LOCATION:${icsText(e.location)}`] : []),
      `URL:${e.url}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/** Lien « Ajouter à Google Agenda ». */
export function googleCalendarUrl(e: Omit<IcsEvent, "uid" | "updatedAt">) {
  const end = e.endsAt ?? new Date(e.startsAt.getTime() + 2 * 3600 * 1000);
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${icsDate(e.startsAt)}/${icsDate(end)}`, details: `${e.description ?? ""}\n${e.url}`.trim() });
  if (e.location) p.set("location", e.location);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

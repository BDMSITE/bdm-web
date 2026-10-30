/* Avatar d'un profil : la photo si elle existe (Blob public), sinon l'initiale. */

const SIZES = {
  sm: "h-14 w-14 text-xl",
  lg: "h-24 w-24 text-4xl",
} as const;

export function Avatar({ name, photo, size = "sm", tone = "light" }: { name: string; photo?: string | null; size?: keyof typeof SIZES; tone?: "light" | "accent" }) {
  const base = `${SIZES[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-bold`;
  const bg = tone === "accent" ? "bg-accent text-ink" : "bg-primary-light text-primary-dark";
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" width={size === "lg" ? 96 : 56} height={size === "lg" ? 96 : 56} className={`${base} bg-paper-2 object-cover`} />;
  }
  return <div aria-hidden className={`${base} ${bg}`}>{name.trim()[0]?.toUpperCase() ?? "?"}</div>;
}

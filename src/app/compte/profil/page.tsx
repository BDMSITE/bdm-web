import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfilForm } from "./form";

export const metadata: Metadata = { title: "Mon profil public" };

/* Édition du profil (CDC §7.16) — données du compte connecté. */

export default async function ProfilComptePage() {
  const session = await auth();
  const profile = await db.profile.findUnique({
    where: { userId: session!.user.id },
    include: { keywords: { include: { keyword: true } } },
  });
  if (!profile) return <p className="text-sm text-muted">Profil introuvable.</p>;

  const visibility = (profile.visibility ?? {}) as { directory?: boolean };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Mon profil public</h1>
          <p className="mt-1 text-sm text-ink-2">Ce que les visiteurs et les membres voient de vous dans l&apos;annuaire.</p>
        </div>
        <Link
          href={`/communaute/membres/${profile.slug}`}
          className="whitespace-nowrap rounded border-2 border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white"
        >
          Voir mon profil comme visiteur
        </Link>
      </div>

      <ProfilForm
        values={{
          displayName: profile.displayName,
          city: profile.city ?? "",
          country: profile.country ?? "",
          bio: profile.bio ?? "",
          website: profile.website ?? "",
          keywords: profile.keywords.map((k) => k.keyword.name).join(", "),
          directory: visibility.directory !== false,
        }}
      />
    </div>
  );
}

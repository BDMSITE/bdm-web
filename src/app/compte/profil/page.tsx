import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfilForm } from "./form";
import { flag } from "@/lib/settings";

export const metadata: Metadata = { title: "Mon profil public" };

/* Édition du profil (CDC §7.16) — données du compte connecté. */

export default async function ProfilComptePage() {
  const session = await auth();
  const profile = await db.profile.findUnique({
    where: { userId: session!.user.id },
    include: { keywords: { include: { keyword: true } }, user: { select: { accountType: true } }, company: true, association: true, artist: true, educations: { orderBy: { endYear: "desc" } } },
  });
  if (!profile) return <p className="text-sm text-muted">Profil introuvable.</p>;

  const visibility = (profile.visibility ?? {}) as { directory?: boolean };
  const proEnAttente = profile.user.accountType !== "MEMBER" && !profile.proVerifiedAt && (await flag("communaute.validation_pro"));

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

      {proEnAttente && (
        <p role="status" className="rounded border border-accent bg-accent-light px-3 py-2.5 text-sm">
          Votre fiche {profile.user.accountType === "COMPANY" ? "entreprise" : profile.user.accountType === "ASSOCIATION" ? "association" : "artiste"} sera visible dans son annuaire après validation par l&apos;équipe. Vous restez visible dans l&apos;annuaire des membres.
        </p>
      )}
      <ProfilForm
        values={{
          displayName: profile.displayName,
          headline: profile.headline ?? "",
          photo: profile.photo ?? "",
          city: profile.city ?? "",
          country: profile.country ?? "",
          bio: profile.bio ?? "",
          website: profile.website ?? "",
          keywords: profile.keywords.map((k) => k.keyword.name).join(", "),
          directory: visibility.directory !== false,
          kind: profile.user.accountType,
          companySize: profile.company?.size ?? "",
          companySector: profile.company?.sector ?? "",
          assocPurpose: profile.association?.purpose ?? "",
          assocFoundedYear: profile.association?.foundedYear ? String(profile.association.foundedYear) : "",
          assocMembersCount: profile.association?.membersCount ? String(profile.association.membersCount) : "",
          artistDiscipline: profile.artist?.discipline ?? "",
          educations: profile.educations.map((e) => ({ school: e.school, field: e.field ?? "", endYear: e.endYear ? String(e.endYear) : "" })),
        }}
      />
    </div>
  );
}

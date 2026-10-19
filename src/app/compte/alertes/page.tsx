import type { Metadata } from "next";
import type { ContentType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONTENT_LABEL } from "@/lib/routes";
import { deleteAlertAction } from "@/lib/actions/compte";
import { EmptyState } from "@/components/site/content";
import { AlerteForm } from "./form";

export const metadata: Metadata = { title: "Mes alertes" };

/* Alertes par mots-clés du compte connecté (CDC §7.1). */

const FREQUENCY: Record<string, string> = { DAILY: "Quotidienne", INSTANT: "Immédiate" };

const TYPE_OPTIONS = (Object.keys(CONTENT_LABEL) as ContentType[]).map((value) => ({ value, label: CONTENT_LABEL[value] }));

export default async function AlertesPage() {
  const session = await auth();
  const alerts = await db.alert.findMany({ where: { userId: session!.user.id }, orderBy: { createdAt: "desc" } });

  const allIds = [...new Set(alerts.flatMap((a) => a.keywordIds as string[]))];
  const keywords = allIds.length
    ? await db.keyword.findMany({ where: { id: { in: allIds } }, select: { id: true, name: true } })
    : [];
  const keywordName = new Map(keywords.map((k) => [k.id, k.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Mes alertes</h1>
        <p className="mt-1 text-sm text-ink-2">
          Recevez par e-mail les nouveaux contenus qui correspondent à vos mots-clés, en envoi groupé quotidien ou immédiat.
        </p>
      </div>

      <AlerteForm types={TYPE_OPTIONS} />

      {alerts.length === 0 ? (
        <EmptyState title="Aucune alerte" text="Créez votre première alerte ci-dessus pour être prévenu·e des contenus qui vous concernent." />
      ) : (
        <ul className="divide-y divide-line border border-line">
          {alerts.map((a) => {
            const ids = a.keywordIds as string[];
            const types = a.contentTypes as ContentType[];
            const allTypes = types.length === TYPE_OPTIONS.length;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex flex-wrap gap-1.5">
                  {ids.map((id) => (
                    <span key={id} className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark">
                      {keywordName.get(id) ?? "Mot-clé supprimé"}
                    </span>
                  ))}
                </div>
                <span className="text-sm text-ink-2">
                  {allTypes ? "Tous les contenus" : types.map((t) => CONTENT_LABEL[t] ?? t).join(", ")}
                </span>
                <span className="whitespace-nowrap rounded border border-line px-2 py-0.5 text-xs font-semibold text-ink-2">
                  {FREQUENCY[a.frequency] ?? a.frequency}
                </span>
                <form action={deleteAlertAction} className="ml-auto">
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="text-xs font-bold text-danger hover:underline">Supprimer</button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted">
        {alerts.length} alerte{alerts.length > 1 ? "s" : ""}. L&apos;envoi des e-mails d&apos;alerte sera activé avec la mise en production du service d&apos;e-mail.
      </p>
    </div>
  );
}

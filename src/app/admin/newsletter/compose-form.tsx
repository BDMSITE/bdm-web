"use client";

import { useActionState, useState } from "react";
import { composeNewsletterAction, type AdminActionState } from "@/lib/actions/admin";

/* Composer un numéro : objet, mot d'introduction, contenus publiés à inclure (cochés). */

const INPUT = "w-full rounded border border-line bg-paper px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function ComposeForm({ contents }: { contents: { id: string; title: string; label: string; date: string }[] }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(composeNewsletterAction, {});
  const [n, setN] = useState(0);
  return (
    <form action={action} className="space-y-4 p-4" onChange={(e) => setN(new FormData(e.currentTarget).getAll("contentIds").length)}>
      {state.error && <p role="alert" className="rounded border border-danger bg-danger-light px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="rounded border border-primary bg-primary-faint px-3 py-2 text-sm text-primary-dark">{state.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="subject" className="mb-1 block text-xs font-bold">Objet de l&apos;e-mail *</label>
          <input id="subject" name="subject" required maxLength={120} placeholder="La lettre de novembre : 12 offres, 5 événements" className={INPUT} />
        </div>
        <div>
          <label htmlFor="intro" className="mb-1 block text-xs font-bold">Mot d&apos;introduction</label>
          <textarea id="intro" name="intro" rows={2} maxLength={800} placeholder="Deux ou trois phrases, ton direct." className={INPUT} />
        </div>
      </div>
      <fieldset>
        <legend className="mb-2 text-xs font-bold">Contenus à inclure ({n} coché{n > 1 ? "s" : ""}) — 40 derniers publiés</legend>
        <ul className="grid max-h-80 gap-1 overflow-y-auto rounded border border-line p-2 sm:grid-cols-2">
          {contents.map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-primary-faint">
                <input type="checkbox" name="contentIds" value={c.id} className="mt-0.5 h-4 w-4 accent-primary" />
                <span>
                  <span className="mr-1 rounded bg-accent-light px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">{c.label}</span>
                  {c.title} <span className="text-xs text-muted">· {c.date}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <button type="submit" disabled={pending} className="rounded bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
        {pending ? "Enregistrement…" : "Enregistrer le numéro (sans envoyer)"}
      </button>
      <p className="text-xs text-muted">Le numéro apparaît ensuite dans la liste avec un bouton « Envoyer ». L&apos;envoi respecte la limite journalière de Brevo et se poursuit seul le lendemain.</p>
    </form>
  );
}

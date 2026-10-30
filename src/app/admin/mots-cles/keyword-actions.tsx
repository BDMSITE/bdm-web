"use client";

import { useActionState, useState } from "react";
import { renameKeywordAction, mergeKeywordAction, deleteKeywordAction, type AdminActionState } from "@/lib/actions/admin";

/* Actions sur un mot-clé : renommer, fusionner dans un autre (contenus, profils et alertes
   déplacés), supprimer. Repliées derrière un bouton pour garder le tableau lisible. */

const INPUT = "rounded border border-line bg-paper px-2 py-1 text-xs focus:border-primary focus:outline-none";
const BTN = "whitespace-nowrap rounded border px-2 py-1 text-xs font-bold disabled:opacity-60";

export function KeywordActions({ id, name, others }: { id: string; name: string; others: { id: string; name: string; family: string }[] }) {
  const [open, setOpen] = useState(false);
  const [rename, renameAction, renaming] = useActionState<AdminActionState, FormData>(renameKeywordAction, {});
  const [merge, mergeAction, merging] = useActionState<AdminActionState, FormData>(mergeKeywordAction, {});
  const [remove, removeAction, removing] = useActionState<AdminActionState, FormData>(deleteKeywordAction, {});
  const msg = [rename, merge, remove].find((s) => s.ok || s.error);
  if (remove.ok || merge.ok) return <span className="text-xs text-primary-dark">{(remove.ok ? remove : merge).message}</span>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${BTN} border-line text-ink-2 hover:border-primary hover:text-primary`}>
        Gérer
      </button>
    );
  }
  return (
    <div className="space-y-1.5 text-left">
      {msg && <p className={`text-xs ${msg.error ? "text-danger" : "text-primary-dark"}`} role={msg.error ? "alert" : "status"}>{msg.error ?? msg.message}</p>}
      <form action={renameAction} className="flex items-center gap-1.5">
        <input type="hidden" name="id" value={id} />
        <input name="name" defaultValue={name} required minLength={2} maxLength={60} aria-label="Nouveau nom" className={`${INPUT} w-40`} />
        <button type="submit" disabled={renaming} className={`${BTN} border-primary text-primary hover:bg-primary hover:text-white`}>Renommer</button>
      </form>
      <form action={mergeAction} className="flex items-center gap-1.5" onSubmit={(e) => { if (!window.confirm(`Fusionner « ${name} » dans le mot-clé choisi ? Contenus, profils et alertes seront déplacés, puis « ${name} » supprimé.`)) e.preventDefault(); }}>
        <input type="hidden" name="id" value={id} />
        <select name="targetId" required aria-label="Fusionner dans" className={`${INPUT} w-40`}>
          <option value="">Fusionner dans…</option>
          {others.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.family})</option>)}
        </select>
        <button type="submit" disabled={merging} className={`${BTN} border-primary text-primary hover:bg-primary hover:text-white`}>Fusionner</button>
      </form>
      <form action={removeAction} className="flex items-center gap-1.5" onSubmit={(e) => { if (!window.confirm(`Supprimer « ${name} » ? Il sera retiré des contenus, profils et alertes.`)) e.preventDefault(); }}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={removing} className={`${BTN} border-danger text-danger hover:bg-danger hover:text-white`}>Supprimer</button>
        <button type="button" onClick={() => setOpen(false)} className={`${BTN} border-line text-ink-2`}>Fermer</button>
      </form>
    </div>
  );
}

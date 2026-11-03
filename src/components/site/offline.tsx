"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { DownloadCloud, CheckCircle2, Trash2, WifiOff } from "lucide-react";

/* Lecture hors ligne des guides : enregistrement du service worker, bouton « Lire hors ligne »
   sur un guide, liste des guides enregistrés. La liste (titre, adresse, date) vit dans le
   navigateur du membre (localStorage) ; les pages elles-mêmes sont dans le cache du service worker. */

const KEY = "bdm.hors-ligne";
const EVENT = "bdm-hors-ligne";
type Saved = { url: string; title: string; savedAt: string };

/* Le stockage local est lu comme une source externe (useSyncExternalStore) : rendu serveur
   neutre, puis valeur réelle côté client, sans setState dans un effet. */
function snapshot(): string {
  try { return localStorage.getItem(KEY) ?? "[]"; } catch { return "[]"; }
}
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(EVENT, cb); };
}
function parse(raw: string | null): Saved[] {
  if (raw === null) return [];
  try { const v = JSON.parse(raw) as Saved[]; return Array.isArray(v) ? v : []; } catch { return []; }
}
function ecrire(list: Saved[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* stockage indisponible : la page reste utilisable */ }
  window.dispatchEvent(new Event(EVENT));
}
function supporte() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "caches" in window;
}
function useSaved() {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
function useEnLigne() {
  return useSyncExternalStore(
    (cb) => { window.addEventListener("online", cb); window.addEventListener("offline", cb); return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); }; },
    () => navigator.onLine,
    () => true,
  );
}

/** À poser une fois dans la coque du site : enregistre /sw.js. */
export function OfflineRegister() {
  useEffect(() => {
    if (!supporte()) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}

/** Fichiers statiques référencés par la page courante, pour qu'elle se rende hors connexion. */
function assetsDeLaPage() {
  const urls = new Set<string>();
  document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href^="/_next/"], link[rel="preload"][href^="/_next/"]').forEach((l) => urls.add(l.href));
  document.querySelectorAll<HTMLScriptElement>('script[src^="/_next/"]').forEach((s) => urls.add(s.src));
  return [...urls];
}

export function SaveOfflineButton({ title }: { title: string }) {
  const raw = useSaved();
  const [etat, setEtat] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    if (!supporte()) return;
    const url = window.location.pathname;
    const onMsg = (e: MessageEvent) => {
      if (e.data?.url !== url) return;
      if (e.data.type === "saved") {
        const list = parse(snapshot()).filter((s) => s.url !== url);
        list.unshift({ url, title, savedAt: new Date().toISOString() });
        ecrire(list);
        setEtat("idle");
      }
      if (e.data.type === "save-failed") setEtat("error");
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, [title]);

  if (raw === null || !supporte()) return null;
  const url = window.location.pathname;
  const ok = parse(raw).some((s) => s.url === url);

  const toggle = async () => {
    const reg = await navigator.serviceWorker.ready;
    if (ok) {
      reg.active?.postMessage({ type: "remove", url });
      ecrire(parse(snapshot()).filter((s) => s.url !== url));
      return;
    }
    setEtat("saving");
    reg.active?.postMessage({ type: "save", url, assets: assetsDeLaPage() });
  };

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={toggle}
        disabled={etat === "saving"}
        aria-pressed={ok}
        title={ok ? "Retirer de la lecture hors ligne" : "Enregistrer ce guide pour le lire sans connexion"}
        className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-bold uppercase disabled:opacity-60 ${ok ? "border-primary bg-primary-faint text-primary-dark" : "border-line text-ink-2 hover:border-primary hover:text-primary"}`}
      >
        {ok ? <CheckCircle2 aria-hidden className="h-4 w-4" /> : <DownloadCloud aria-hidden className="h-4 w-4" />}
        {etat === "saving" ? "Enregistrement…" : ok ? "Disponible hors ligne" : "Lire hors ligne"}
      </button>
      {etat === "error" && <span className="mt-1 text-xs text-danger">Enregistrement impossible pour l&apos;instant.</span>}
    </span>
  );
}

export function OfflineGuidesList({ compact = false }: { compact?: boolean }) {
  const raw = useSaved();
  const enLigne = useEnLigne();
  if (raw === null) return null;
  if (!supporte()) return compact ? null : <p className="text-sm text-muted">Votre navigateur ne permet pas la lecture hors ligne.</p>;
  const list = parse(raw);

  const retirer = async (url: string) => {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "remove", url });
    ecrire(parse(snapshot()).filter((s) => s.url !== url));
  };

  return (
    <div className={compact ? "" : "border border-line p-4"}>
      <p className="flex items-center gap-2 font-bold">
        <DownloadCloud aria-hidden className="h-4 w-4 text-primary" /> Mes guides hors ligne
        {!enLigne && <span className="ml-auto inline-flex items-center gap-1 rounded bg-accent px-2 py-0.5 text-[0.7rem] font-bold uppercase text-ink"><WifiOff aria-hidden className="h-3 w-3" /> hors connexion</span>}
      </p>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-ink-2">Aucun guide enregistré. Sur un guide, cliquez « Lire hors ligne » : il restera lisible sans connexion, et sera mis à jour à votre prochaine visite en ligne.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line text-sm">
          {list.map((s) => (
            <li key={s.url} className="flex items-center gap-3 py-2">
              <Link href={s.url} className="min-w-0 flex-1 truncate font-semibold hover:text-primary">{s.title}</Link>
              <span className="whitespace-nowrap text-xs text-muted">{new Date(s.savedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
              <button type="button" onClick={() => retirer(s.url)} aria-label={`Retirer « ${s.title} »`} className="text-ink-2 hover:text-danger"><Trash2 aria-hidden className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

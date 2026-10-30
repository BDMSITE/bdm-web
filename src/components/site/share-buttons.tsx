"use client";

import { useState } from "react";
import { Share2, Link as LinkIcon, Check } from "lucide-react";

/* Partage en un clic : WhatsApp (canal n°1 de la diaspora), partage natif du téléphone,
   copie du lien, Facebook, LinkedIn. L'URL est absolue (image de partage générée côté serveur). */

const WA = (
  <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.3c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.3 8.3 0 1 1 12 20.3z" />
  </svg>
);

export function ShareButtons({ url, title, compact = false }: { url: string; title: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const text = `${title} — Béninois du Monde`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const btn = "inline-flex items-center gap-1.5 rounded border border-line px-2.5 py-1.5 text-xs font-bold text-ink-2 hover:border-primary hover:text-primary";

  async function natif() {
    try {
      if (navigator.share) await navigator.share({ title: text, url });
      else await copier();
    } catch {
      /* partage annulé */
    }
  }
  async function copier() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez ce lien :", url);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Partager">
      <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn} border-[#25D366] text-[#128C7E] hover:bg-[#25D366] hover:text-white`}>
        {WA} WhatsApp
      </a>
      {!compact && (
        <>
          <a href={fb} target="_blank" rel="noopener noreferrer" className={btn}>Facebook</a>
          <a href={li} target="_blank" rel="noopener noreferrer" className={btn}>LinkedIn</a>
        </>
      )}
      <button type="button" onClick={copier} className={btn} aria-live="polite">
        {copied ? <Check aria-hidden className="h-3.5 w-3.5" /> : <LinkIcon aria-hidden className="h-3.5 w-3.5" />} {copied ? "Lien copié" : "Copier le lien"}
      </button>
      <button type="button" onClick={natif} className={`${btn} sm:hidden`}>
        <Share2 aria-hidden className="h-3.5 w-3.5" /> Partager
      </button>
    </div>
  );
}

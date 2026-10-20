"use client";

import Script from "next/script";

/* Widget Turnstile : ne rend rien tant que la clé publique n'est pas configurée. */
export function Turnstile({ siteKey }: { siteKey: string }) {
  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="cf-turnstile" data-sitekey={siteKey} data-language="fr" data-theme="light" />
    </>
  );
}

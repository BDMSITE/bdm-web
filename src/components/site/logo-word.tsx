"use client";

import { useEffect, useState } from "react";

/* Le « du Monde » du logo tourne entre quatre langues, clin d'œil à la
   diaspora sur tous les continents. Statique si l'utilisateur préfère
   réduire les animations. */

const WORDS = ["du Monde", "of the World", "del Mundo", "der Welt"];

export function LogoWord({ className }: { className?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((v) => (v + 1) % WORDS.length), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <span key={i} className={`bdm-logo-word ${className ?? ""}`}>
      {WORDS[i]}
    </span>
  );
}

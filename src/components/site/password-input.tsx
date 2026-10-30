"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

/* Champ mot de passe avec bouton « afficher / masquer ». Même classes que les autres
   champs ; le bouton est hors du flux du formulaire (type="button"), accessible au clavier. */

export function PasswordInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        title={visible ? "Masquer" : "Afficher"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-2 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {visible ? <EyeOff aria-hidden className="h-4 w-4" /> : <Eye aria-hidden className="h-4 w-4" />}
      </button>
    </div>
  );
}

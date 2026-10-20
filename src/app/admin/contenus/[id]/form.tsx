"use client";

import type { ContentStatus, ContentType } from "@prisma/client";
import { ContentForm, type ContentFormValues } from "../content-form";

/* Édition admin d'un contenu existant : le formulaire générique en mode « edit ».
   Le type ne change pas ; le statut est choisi librement par l'équipe. */

export function EditContentForm({ id, type, status, values }: { id: string; type: ContentType; status: ContentStatus; values: ContentFormValues }) {
  return (
    <div className="rounded border border-line bg-paper p-5">
      <ContentForm mode="edit" id={id} type={type} status={status} values={values} />
    </div>
  );
}

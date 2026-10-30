import { put, del } from "@vercel/blob";

/* Photos de profil : Blob public Vercel, 2 Mo, JPG / PNG / WebP. */

const PHOTO_MAX = 2 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Nouvelle photo ou null si rien n'est envoyé. Lève une erreur lisible sinon. */
export async function uploadPhoto(profileId: string, file: FormDataEntryValue | null): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = PHOTO_TYPES[file.type];
  if (!ext) throw new Error("Photo : format accepté JPG, PNG ou WebP.");
  if (file.size > PHOTO_MAX) throw new Error("Photo : 2 Mo maximum.");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Photo : stockage non configuré sur ce serveur.");
  const r = await put(`profils/${profileId}-${Date.now()}.${ext}`, file, { access: "public", contentType: file.type, addRandomSuffix: true });
  return r.url;
}

export async function removePhotoBlob(url: string | null | undefined) {
  if (url && url.includes(".public.blob.vercel-storage.com/") && process.env.BLOB_READ_WRITE_TOKEN) await del(url).catch(() => {});
}

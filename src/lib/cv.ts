/* CV déposé sur le site : fichier PDF dans le Blob privé Vercel, servi par
   /api/cv/[profileId] après contrôle d'accès. Profile.cvUrl vaut alors ce
   chemin interne ; sinon c'est un lien externe collé par le membre. */
export const cvBlobPath = (profileId: string) => `cv/${profileId}.pdf`;
export const cvRoute = (profileId: string) => `/api/cv/${profileId}`;
export const isHostedCv = (cvUrl: string | null | undefined) => Boolean(cvUrl?.startsWith("/api/cv/"));
export const CV_MAX_BYTES = 3 * 1024 * 1024;

# Workflows désactivés

Le projet ne paie pas de CI : **Vercel sert de CI** — `vercel.json` lance `pnpm check` (eslint + tsc)
puis `pnpm build` à chaque push, et bloque le déploiement si ça casse.

Seul le scan de secrets (`../workflows/gitleaks.yml`) tourne sur GitHub Actions, gratuit pour un dépôt public.
Pour réactiver `ci.yml` ou `smoke.yml`, les redéplacer dans `workflows/`.

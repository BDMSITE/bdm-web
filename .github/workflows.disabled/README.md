# Workflows désactivés

GitHub Actions est verrouillé sur le compte (« account locked due to a billing issue »)
et le projet ne paie pas de CI : **Vercel sert de CI** — `vercel.json` lance
`pnpm check` (eslint + tsc) puis `pnpm build` à chaque push, et bloque le
déploiement si ça casse. Pour réactiver ces workflows, les redéplacer dans `workflows/`.

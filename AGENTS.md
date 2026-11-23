# bdm-web — Béninois du Monde

> **Commence par lire `ETAT-PROJET.md`** (niveau du projet, liens vitaux, prochaine étape) et tiens-le à jour à chaque étape franchie.

Portail média + communautaire de la diaspora béninoise (modèle : reunionnaisdumonde.com).
Client : HCBE. Dev : Josué (JOJO.DEV's). Cahier des charges : Notion « 🇧🇯 Béninois du Monde » + `~/Desktop/HCBE-reprise/CDC-Beninois-du-Monde-v2.md`.

## Stack

Next.js 16 (App Router, `next dev --webpack`) + React 19 + TypeScript strict · Tailwind v4 (tokens dans `src/app/globals.css`) · Prisma 7 + PostgreSQL (Neon en prod, Docker en local) · Meilisearch avec repli Postgres · Auth.js 5 · Brevo (sinon Resend) · MapLibre + fond OSM (MapTiler optionnel) · **KKiaPay** (zone franc) + **Stripe** (hors zone franc) · Blob Vercel · n8n · Vercel.

## Commandes

- `pnpm dev --webpack` — dev server (Turbopack casse sur `next/font` Google)
- `docker compose up -d` — Postgres (**5433**, un Postgres Homebrew occupe souvent 5432) + Meilisearch (7700) locaux
- `pnpm prisma migrate dev` — migrations ; `pnpm prisma studio` — inspecter la base
- `pnpm check` — prisma generate + eslint + next typegen + tsc, à faire passer avant tout commit (c'est aussi ce que lance `vercel.json` à chaque push, et le déploiement est bloqué si ça casse)

## Structure réelle

- `src/app` — pages publiques à la racine (accueil, `emploi`, `magazine`, `communaute`, `adresses`, `agenda`, `pratique`, `memoire`, `pays`, `legal`…) ; il n'y a **pas** de groupes de routes `(site)` / `(compte)` / `(admin)`
- `src/app/compte` — espace membre connecté · `src/app/admin` — back-office
- `src/app/api` — webhooks de paiement, crons, exports CSV, CV, comptage des pubs ; le flux RSS (`flux.xml`), le sitemap et l'iCal sont des routes de `src/app`
- `src/proxy.ts` — contrôle d'accès (Next 16 : proxy = ex-middleware), lit le seul JWT : `/compte/*` connecté, `/admin/*` rôle d'équipe, `REGIE` limité à `/admin/regie`. **`/api/*` est hors du matcher** : chaque route d'API fait son propre contrôle
- `src/lib` — couche métier (une unité par domaine) · `src/lib/actions` — server actions, chacune derrière son garde d'authentification
- `prisma/schema.prisma` — 40 modèles ; entité centrale `Content` typée + géolocalisée + taguée par `Keyword`

## Règles du projet

- **Design** : single-theme fond blanc, esprit magazine. Vert #008751 = navigation/actions, jaune #FCD116 = mises en avant, rouge #E8112D = alertes UNIQUEMENT. Titres Fraunces, texte Source Sans 3. Tokens et classes utilitaires (`.section-title`, `.card-location`, `.tricolor`) dans `globals.css` — ne pas hardcoder de couleurs.
- **Mobile d'abord** ; la colonne latérale passe en fin de page sur mobile.
- **Jamais d'e-mail exposé** : tout contact passe par un formulaire relais (`Message`).
- **Tout contenu** porte lieu (pays/ville) + mots-clés ; toute liste a filtres, compteur et « Voir sur la carte ».
- **Modération** : contenu membre → statut `IN_MODERATION` avant `PUBLISHED`.
- **Français** : UI et messages d'erreur en français.
- Pas de secret dans le code : variables dans `.env` (voir `.env.example`), Gitleaks tourne en CI.

## Branches

`main` = production, `staging` = préprod, travail en `feat/*` → PR vers `staging`.

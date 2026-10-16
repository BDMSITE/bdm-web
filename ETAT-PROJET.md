# ÉTAT DU PROJET — Béninois du Monde

> ⚠️ **Claude : lis ce fichier en début de session et METS-LE À JOUR à chaque étape franchie.**
> Il est la mémoire du projet en cas de compactage de contexte. Dernière mise à jour : **22/09/2026**.

## Le projet en une phrase
Média + réseau de la diaspora béninoise pour le HCBE, calqué sur reunionnaisdumonde.com,
from scratch en Next.js — remplace l'ancien WordPress de beninois-du-monde.com (audit 14/09/2026).

## 📍 NIVEAU ACTUEL : SOCLE S1 fonctionnel en local (12/10/2026)
Fait en local : base Postgres + Meilisearch (Docker/OrbStack installé), migration `init`, seed de démo,
Auth.js (inscription → lien d'activation → connexion, mot de passe + lien magique), annuaire et fiche
profil en base, recherche Meilisearch, routes protégées, build de prod vert.
**Reste pour clore S1** : comptes services (Neon, Resend, MapTiler — aucun ouvert à ce jour), variables
d'env Vercel + base Neon, CI verte sur un push, démo à Josué (critères §7 Notion Socle).
Toujours en attente : retours HCBE sur la maquette, atelier questionnaire (58 questions dans Notion).

### Lancer le socle en local
```
docker compose up -d            # Postgres 5433 + Meilisearch 7700 (docker = ~/.orbstack/bin/docker)
cp .env.example .env            # puis AUTH_SECRET=$(openssl rand -base64 32)
pnpm prisma migrate dev && pnpm db:seed && pnpm search:reindex
pnpm dev --webpack              # Turbopack casse sur next/font Google en worktree
```
Comptes de démo : voir `prisma/seed.ts` (admin@…, redaction@…, membres) — mot de passe `DEMO_PASSWORD`.
Sans `RESEND_API_KEY`, les e-mails (lien magique / activation) s'affichent dans la console du serveur.
⚠️ Un Postgres Homebrew occupe le port 5432 de la machine → la base du projet est sur **5433**.

## Liens vitaux
- **Maquette en ligne (publique, envoyée au HCBE)** : https://bdm-web-jojo-devs-projects.vercel.app
- **Vercel** : team `team_jmu7x2nDWnI2r8qmpsUBFeBB` (JOJO DEV's projects, hobby), projet `prj_vWuKacWXTE2QC0VgrCe1j0Y53Qoe` (bdm-web), lié au repo GitHub → déploiement auto à chaque push sur main. Protection SSO désactivée volontairement (revue HCBE).
- **GitHub** : JOJODEVS-GIT/bdm-web (compte perso de Josué, transfert vers une org prévu plus tard)
- **Notion projet** : https://app.notion.com/p/3dc1ecad443581cfb74adf7f1a6e279d — contient : CDC v2 importé,
  bases ❓ Questionnaire (58 q), 🧭 Journal des décisions, 📅 Comptes rendus, 🗂️ Étapes du projet (tâches S0→S8),
  ✅ Vérification des maquettes, pages 🏗️ Socle technique / 🔐 Accès & comptes / 🎨 Design system
- **Docs locaux** : ~/Desktop/HCBE-reprise/ (CDC v2 md/docx/txt, audit ancien site) · ~/Desktop/BDM-captures/ (62 pages desktop+mobile)
- **Lanceur local** : double-clic `Lancer-le-site.command` (port 3457)

## Ce qui est FAIT
- Audit ancien WordPress (14/09) → décision from scratch → CDC v2 « modèle média RDM » validé
- **62 écrans maquette** (public + espace membre 9 + admin dashboard 13 + fiches détail + 404), données d'exemple
- Design validé par Josué : header A « institutionnel inversé » (bandeau vert + nav claire + sticky + recherche + fil d'Ariane),
  footer pro (colonnes soulignées jaune), typo **Public Sans** partout, icônes **Lucide** (zéro emoji),
  carte **MapLibre réelle** (ouverte accueil / repliée ailleurs, toggle chevron, fallback sans WebGL)
- Mobile complet : burger fonctionnel, nav admin défilante, zéro débordement horizontal (body overflow-x clip)
- **22/09 — refonte façon RDM validée par Josué (structure copiée du modèle, couleurs BDM)** :
  header clair (recherche / logo centré / réseaux + connexion) + barre nav verte 44px avec bloc
  « Emploi & Stages » jaune ; carte : filtres flottants (lieu + thèmes cochables), clusters ronds verts,
  bouton replier/déplier flottant centré (onglet suspendu quand repliée) ; bas de page : pub + panorama
  SVG (piste latérite, palmiers) plongeant dans le footer ; police manuscrite **Caveat** pour le mot
  mis en avant des titres (`.section-title em`) et le « du Monde » du logo ; ombre `.card-soft` sur les cartes.
  ⚠️ Dev en worktree : `next dev` (Turbopack) casse sur next/font Google → utiliser `next dev --webpack`.
- **23/09 — photo réelle bas de page** : boulevard de la Marina, Cotonou (Wikimedia, Osia Zannou,
  CC BY-SA 4.0, crédit affiché) dans `public/images/`.
- **23/09 — différenciation validée par Josué (sugg. 1-2-3 + afro 1-2-4-5)** :
  ticker « En direct » sous la nav (défilement, données d'exemple, pause au survol) ·
  motif wax discret `.wax-bg` sur tous les bandeaux verts et le footer ·
  page **Compétences de la diaspora** (`/communaute/competences` + teaser accueil + lien footer) ·
  rubrique Racines renforcée sur `/memoire` (guide nationalité loi 2024-31 / My Afro Origins,
  récit Agudas) · **version EN** `/en/roots` (seule rubrique traduite) ·
  article `/magazine/les-agudas` · badge « Afrodescendant·e » (annuaire membres) +
  thème « Afrodescendants » sur la carte ·
  **admin** : modules « Compétences » (validation experts, mises en relation) et
  « En direct (ticker) » (messages épinglés + flux auto), raccourcis dashboard.
- Règles UI actées : libellés courts/2-3 mots toujours en nowrap · cartes d'annuaire hauteurs égales pied calé ·
  largeur stable (main width:100%, scrollbar-gutter stable) · header/footer pleine largeur, contenu max-w-6xl
- Prisma 7 + Zod installés (schéma 20 entités écrit, prisma.config.ts), lucide-react, maplibre-gl
- **CI = Vercel (zéro coût, décision Josué 12/10)** : GitHub Actions reste verrouillé sur le compte (billing) et on ne
  paie pas → workflows déplacés dans `.github/workflows.disabled/`, `vercel.json` lance `pnpm check` (eslint + tsc)
  puis `pnpm build` à chaque push et bloque le déploiement si ça casse.
- **Recherche** : Meilisearch si `MEILI_HOST` est défini, sinon **repli Postgres** (Prisma ILIKE) — même page, mêmes
  facettes. En prod, pas de Meilisearch hébergé (payant) tant que ce n'est pas nécessaire.
- Le socle est poussé sur **`staging`** (pas main : il manque AUTH_SECRET/DATABASE_URL sur Vercel).
- **13/10 — Vercel branché** : CLI connecté (compte `spamking035-9849`, équipe JOJO DEV's projects), projet lié,
  **Neon Postgres gratuit** provisionné via Marketplace (ressource `bdm-db`, région us-east-1, DATABASE_URL + variantes
  posées sur prod/preview/dev), `AUTH_SECRET` / `AUTH_TRUST_HOST` / `EMAIL_FROM` posés (prod + preview), migration
  `init` appliquée et seed de démo chargé sur Neon (via DATABASE_URL_UNPOOLED ; le pooler sert au site).
  `vercel env pull` écrit `.env.local` qui **prend le pas sur `.env`** → le supprimer pour rester sur Docker en local.
- E-mails en prod : compte Resend ou Brevo gratuit à créer (sans domaine = sandbox) → sans clé, les liens magiques
  n'arrivent que dans les logs Vercel.
- **Plan de progression S1 → S8** consigné dans Notion « 📈 Plan de progression » (~20-24 j de dev) ; **budget** pour le
  HCBE dans le doc partagé « Budget Béninois du Monde » (tout gratuit au lancement ; Vercel Pro ~18 €/mois dès la
  première pub ; fonctionnement recommandé ~27 €/mois). E-mails : choix **Brevo** (gratuit, envoie sans domaine) →
  adapter `src/lib/mail.ts` quand la clé arrive.
- **13/10 — espace membre réel** (`/compte` = compte connecté, `/compte/profil` éditable) et **import des membres
  prêt** : `pnpm import:membres fichier.xlsx` (simulation) puis `--go` ; mapping des en-têtes dans
  `scripts/import-membres.ts` (COLONNES) à ajuster au vrai fichier ; page admin `/admin/imports` pour envoyer les
  invitations par lots (quota Brevo 300/jour), relance auto après 7 j. Testé de bout en bout en local.
  **13/10 — IMPORT FAIT (local + Neon)** depuis `~/Desktop/Base de Données BIG DATA PERSO MAJ NOV 2020.xlsx` :
  278 comptes PENDING_EMAIL (source `excel-hcbe-2020`, pays/ville normalisés, fonction → `Profile.headline`,
  téléphone privé → `Profile.phone`), 150 lignes sans e-mail (rapport `rapport-import-*.csv`, à compléter dans
  l'Excel puis relancer : le script ignore les comptes déjà créés), 17 abonnés « presse » + 3 « coopération
  décentralisée » (Subscriber, pas de compte). `Synthese_besoins_entreprises_SIAL_Paris_2026.xlsx` → 10 contenus
  HELP_REQUEST publiés (`pnpm import:sial`). Les comptes importés n'apparaissent dans l'annuaire qu'une fois activés.
  **Attend** : la clé Brevo pour lancer les invitations depuis /admin/imports (données de 2020 : prévoir des rebonds).
  ⚠️ Toute migration doit être appliquée sur Neon (`prisma migrate deploy` avec DATABASE_URL_UNPOOLED) **avant** le
  push sur main.
- .npmrc : fetch-timeout 10 min (connexion lente — les gros paquets échouent sinon)

- **16/10 — sécurité** : mots de passe des 10 comptes de démo **remplacés en prod** (le dépôt est public, l'ancien
  était lisible dans prisma/seed.ts) → nouveau mot de passe dans `~/Desktop/bdm-acces-demo.txt` (jamais dans le dépôt) ;
  en-têtes de sécurité (next.config.ts : nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, X-Powered-By
  retiré) ; redirection post-connexion verrouillée aux chemins internes ; Next 16.3.5 → 16.4.1 (RCE next/og corrigée),
  sharp 0.35.5, xlsx 0.20.3 (tarball SheetJS : npm reste bloqué en 0.18.5 vulnérable). Audit prod restant : 8 alertes
  toutes dans l'outil CLI Prisma (studio/lodash/mysql2), jamais exécuté en prod.
  **Les 10 besoins SIAL sont masqués (IN_MODERATION)** en attendant l'accord de Josué/HCBE.
  À faire (S7) : rate-limit connexion/inscription/lien magique (Upstash gratuit), Turnstile, 2FA admin, CSP.

## Ce qui RESTE (ordre)
1. Retours HCBE sur la maquette → corrections
2. Prérequis Josué (page Socle §0) puis **S1 socle** : docker compose up, migrate, client Prisma+adapter pg,
   seed démo, Auth.js 4 types de comptes, routes protégées, Meilisearch, Resend, env Vercel — critères de fin §7
3. Atelier questionnaire HCBE → figer nom/monétisation/adhésion → S2 magazine dynamique, etc. (Étapes Notion)

## Conventions de travail (Josué)
- Chaque correction : vérifier au navigateur (+ mobile 390px si UI), lint+tsc, commit clair FR, push (→ Vercel auto)
- Tout consigner dans Notion : décisions → Journal, tâches → Étapes, revue → Vérification, réunions → Comptes rendus
- Ne PAS élargir ses demandes (il l'a recadré une fois) ; proposer avant d'ajouter
- Données d'exemple marquées comme telles ; jamais d'e-mail exposé (relais) ; français partout

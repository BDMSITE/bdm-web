# ÉTAT DU PROJET — Béninois du Monde

> ⚠️ **Claude : lis ce fichier en début de session et METS-LE À JOUR à chaque étape franchie.**
> Il est la mémoire du projet en cas de compactage de contexte. Dernière mise à jour : **22/09/2026**.

## Le projet en une phrase
Média + réseau de la diaspora béninoise pour le HCBE, calqué sur reunionnaisdumonde.com,
from scratch en Next.js — remplace l'ancien WordPress de beninois-du-monde.com (audit 14/09/2026).

## 📍 NIVEAU ACTUEL : site réel et sécurisé (S7 livré), en attente de contenu et de la clé Brevo (20/10/2026)
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
  **Les 10 besoins SIAL sont PUBLIÉS depuis le 21/10** (rubrique Chercher / trouver, local + prod) ; `pnpm sial:statut --masquer` pour les retirer d'un coup.
  S7 fait le 20/10 (voir plus bas). Reste : 2FA admin, CSP.

- **19/10 — GRAND NETTOYAGE (validé par Josué) : plus aucune donnée inventée sur le site.** 66 pages → toutes lisent
  la base ou affichent un état vide honnête. Couche de données `src/lib/content.ts` + composants `content.tsx` /
  `section-page.tsx` (fabrique des rubriques + fiche détail générique `/[rubrique]/[slug]`). Pages « exemple »
  supprimées, 23 contenus de démo purgés (local + prod), profils de démo retirés de l'annuaire (comptes gardés).
  Réels désormais : accueil, ticker (derniers contenus), carte (membres géolocalisés), 7 rubriques + fiches, mot-clé
  `/mot/[slug]`, communauté (4 annuaires), **guichet Publier** (→ IN_MODERATION), contact (relais e-mail),
  espace membre complet (alertes, publications, CV, sécurité, export/suppression RGPD), **back-office** (modération
  publier/refuser, rédaction d'articles, emploi, services, mots-clés, newsletter, journal d'audit, paramètres).
  Pages légales et HCBE : squelettes « à compléter par le HCBE ». Inventaire du contenu à fournir : Notion
  « 📋 Pages à remplir ». Sécurité : un compte suspendu ne peut plus rentrer par lien magique.

- **20/10 — reprise de l'ancien site + textes légaux.** L'ancien WordPress (beninois-du-monde.com) est toujours en
  ligne et expose ses contenus par API : `pnpm import:wordpress --go` a repris **23 lieux de mémoire + 2 itinéraires**
  (textes courts du HCBE, source citée, catégorie déduite, à relire par un historien) et la **Charte de la communauté**
  (`src/content/charte-communaute.json`). Ressources (5) et guides (4) trop courts (110-200 car.) : non importés.
  Les pages Mentions légales / Confidentialité / À propos de l'ancien site sont vides. **Textes légaux v1 rédigés**
  (mentions, confidentialité RGPD + APDP Bénin, CGU + charte HCBE) dans `/legal/[slug]`. **21/10 : identité légale
  remplie avec les seuls faits vérifiés** (hcbe-monde.org + 2 sources : association d'utilité publique, créée à Cotonou en
  déc. 1997, enregistrée n° 2000/399/MISAT/DC/SG/DAI/SAAP-Assoc du 06/11/2000, siège Cotonou) ; directeur de publication
  = le Président du Bureau exécutif mondial en exercice (nom à confirmer par le HCBE — sources publiques : Romain Da Costa) ;
  juridiction par défaut : Cotonou (à faire valider par le conseil juridique) ; pas de numéro de décret (2001-153 / 2001-155
  selon les sources). Plus aucun encadré « à compléter ».

- **20/10 — S3/S4 cœur livré** : **messagerie relais** (écrire à un membre depuis sa fiche, répondre à une offre /
  annonce / demande depuis la fiche contenu, fils de discussion dans `/compte/messages`, notification e-mail sans
  adresse exposée, quota 20 messages/h) ; **candidatures** (formulaire sur les offres, CV pré-rempli, `/compte/candidatures`
  côté candidat, `/compte/candidatures-recues` côté recruteur avec réponse relais) ; **édition / retrait / republication**
  de ses publications (retour en modération) ; **favoris** ; **géocodage Nominatim** des villes (à l'enregistrement du
  profil + `pnpm geocode` de rattrapage, fait en local et en prod) → la carte affichera les membres dès activation.

- **20/10 — S7 sécurité + back-office complet.** **Sauvegarde quotidienne** de la base : cron Vercel 03:00 UTC →
  `/api/cron/backup` (protégé par CRON_SECRET, posé en prod/preview) → export JSON de toutes les tables dans le **Blob
  privé Vercel** `bdm-fichiers` (store créé, jeton BLOB_READ_WRITE_TOKEN en prod/preview/.env), 30 derniers conservés ;
  `pnpm db:backup` en local (→ `backups/`, gitignoré). **Limitation des tentatives** sans service externe (table
  `RateLimit`, migration appliquée en local et sur Neon) : connexion 5/e-mail et 10/IP par ¼ h, lien magique, inscription
  5/IP/h, contact 5/IP/h, messages déjà 20/h. **Anti-robot Cloudflare Turnstile** prêt (inscription + contact) : inactif
  tant que `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` ne sont pas posées (compte Cloudflare gratuit à
  créer, S8). **Dépôt de fichier CV** (PDF ≤ 3 Mo) dans le Blob privé, servi par `/api/cv/[id]` uniquement au
  propriétaire, à l'équipe, aux membres connectés si « CV visible » et aux recruteurs ayant reçu sa candidature ;
  le lien externe reste possible. **Formulaires admin** : « Nouveau lieu de mémoire », « Nouvelle personnalité »
  (Béninois qui comptent), « Nouveau contenu » (adresse, événement, bon plan, annonce, demande d'aide), « Nouvelle offre »
  (emploi/stage), **édition de tout contenu** `/admin/contenus/[id]` (statut, lieu géocodé, coordonnées, détails par
  type, journal d'audit). ⚠️ `vercel blob`/`vercel env pull` écrivent un `.env.local` (Neon) qui prend le pas sur
  `.env` : le supprimer aussitôt. Catégories de lieux de mémoire (Site historique, Musée, Monument…) à valider HCBE.

- **27/10 — RÉGIE PUBLICITAIRE (S6) livrée.** 4 emplacements à format fixe (`src/lib/pub-slots.ts`) : bandeau haut de
  rubrique 970×90, pavé latéral 300×250, pavé milieu d'accueil 728×90, bannière bas de page 970×90 (mobile 320×100 / 300×250).
  Modèle `Banner` réécrit (campagne : annonceur, emplacement, modèle **image** fournie ou **carte** générée logo + accroche +
  couleur, lien, dates, poids, ciblage rubriques/pays, statut, maison) + `BannerStat` (stats par jour). Rotation pondérée,
  **vendues d'abord, campagnes maison en repli** : un emplacement n'est jamais vide, et rien ne s'affiche s'il n'y a rien.
  Clic compté par `/api/pub/clic/[id]` (redirection), affichage compté après envoi de la page. Mention « Publicité · annonceur »
  et `rel=sponsored` partout. **16 campagnes maison** (4 sites × 4 emplacements : Wanilo Studio, Petit Train de Cotonou,
  Dahomey Discovery, Bonne Arrivée ; logos dans `public/pub/`) créées en local et sur Neon par `pnpm pub:maison`.
  Back-office `/admin/regie` : tableau de bord (en diffusion, à valider, affichages/clics 30 j), état des 4 emplacements,
  création / édition (`/admin/regie/[id]`, dépôt du visuel dans le Blob public), Diffuser / Arrêter / Refuser, journal d'audit.
  **Nouveau rôle `REGIE`** : accès au seul menu Régie (proxy + nav filtrée) — à attribuer depuis /admin/communauté quand le
  HCBE nommera quelqu'un. Page /annonceurs : formats réels. Migration `regie_pub` appliquée en local et sur Neon.
  **27/10 soir — refonte du rendu (demande Josué)** : chaque emplacement est un **carrousel** qui fait défiler toutes les
  campagnes actives (6 s, glissement, pause au survol, balayage tactile, points, barre de progression, `motion-reduce`) ;
  cartes « affiche » : photo d'ambiance du site traitée (dégradé teinté + motif wax léger + zoom lent), logo en badge blanc,
  titre display, accroche, bouton jaune « Découvrir », mention « Publicité · 4 partenaires ». Photos recadrées en 2 formats
  dans `public/pub/photos/` ; champ `Banner.photo` (migration `banner_photo`, local + Neon). Affichages comptés par balise
  `/api/pub/vue/[id]` quand la carte est réellement montrée. Vérifié bureau + mobile (bandeaux 100 px de haut sur mobile).
  **27/10 (validé Josué : « le style des cases pub c'est nice »)** : logo Petit Train recoloré rouge brique sur fond
  transparent (badge blanc homogène). **Photo du bas de page remplacée** : la Porte du Non-Retour à Ouidah (Wikimedia
  Commons, Aurelefreddy, CC0) **puis, le même jour, par le visuel fourni par Josué** : fresque murale de la diaspora
  (image générée, 1600×672 agrandie et recadrée en bande 3840×1440, `public/images/fresque-diaspora.jpg`, 450 Ko, sans
  crédit requis). Mention « Publicité · N partenaires » retirée sous les encarts (aria-label + rel=sponsored conservés).
- **27/10 — décision Josué : la publicité est réservée au propriétaire du site.** Le libre-service annonceur (dépôt
  par les membres) a été construit puis **retiré le jour même** : les membres n'ont aucune entrée publicité, tout passe
  par `/admin/regie` (admin ou rôle Régie). Les annonceurs écrivent par le formulaire de contact, la régie crée la
  campagne pour eux. Reste côté régie : devis/FedaPay, rapport mensuel automatique, ciblage par pays, encart newsletter.

## Ce qui RESTE (ordre)
1. **Josué / HCBE** : clé Brevo (puis invitations des 278 comptes importés depuis /admin/imports), e-mail projet +
   Bitwarden, organisation GitHub, accès registrar beninois-du-monde.com, confirmation du nom du directeur de publication
   et de la juridiction (/legal), contenu réel (Notion « 📋 Pages à remplir »), relecture des lieux de mémoire.
2. **Régie, suite** : libre-service annonceur, rapport mensuel, FedaPay ; attribuer le rôle Régie à la personne du HCBE.
3. **S8 mise en ligne** : compte Cloudflare (Turnstile), bascule DNS du domaine, Resend ou Brevo en prod, mesure
   d'audience (Vercel Analytics gratuit), test complet du parcours inscription → activation → publication.
4. Plus tard : 2FA admin, CSP, Meilisearch hébergé si besoin, validation des comptes pro, modèle « expert ».

## Conventions de travail (Josué)
- Chaque correction : vérifier au navigateur (+ mobile 390px si UI), lint+tsc, commit clair FR, push (→ Vercel auto)
- Tout consigner dans Notion : décisions → Journal, tâches → Étapes, revue → Vérification, réunions → Comptes rendus
- Ne PAS élargir ses demandes (il l'a recadré une fois) ; proposer avant d'ajouter
- Données d'exemple marquées comme telles ; jamais d'e-mail exposé (relais) ; français partout

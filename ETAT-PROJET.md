# ÉTAT DU PROJET — Béninois du Monde

> ⚠️ **Claude : lis ce fichier en début de session et METS-LE À JOUR à chaque étape franchie.**
> Il est la mémoire du projet en cas de compactage de contexte. Dernière mise à jour : **05/11/2026 (soir)**.

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

- **27/10 — RESTAURATION + DOUBLE AUTHENTIFICATION.** `pnpm db:restore --file <json> --yes` (ou `--latest` pour
  la dernière sauvegarde du Blob) remplace tout le contenu d'une base par une sauvegarde : ordre d'insertion déduit du
  schéma Prisma, auto-références (fils de messages) en plusieurs passes, transaction unique ; testé en local (931 lignes,
  état identique avant/après). **2FA TOTP** sans dépendance (RFC 6238, vecteurs de test vérifiés) pour les rôles de
  l'équipe : activation dans Mon espace → Sécurité (QR code + clé manuelle + premier code), connexion en deux étapes
  (mot de passe → jeton signé 5 min → page du code → fournisseur Auth.js « two-factor »), 5 essais/¼ h, désactivation
  par mot de passe + code, audit user.2fa_on/off. Compatible Google Authenticator, Authy, Bitwarden, 1Password.
  Optionnelle pour l'instant : à rendre obligatoire pour ADMIN quand Josué et la personne du HCBE l'auront activée.

- **30/10 — FINALISATION.** **CSP** en production (next.config.ts : scripts du site + Turnstile + Vercel Analytics,
  tuiles OSM, Blob Vercel, images https, cadres Turnstile seulement ; désactivée en dev). **Vercel Analytics** posé
  dans le layout (gratuit ; à activer d'un clic dans le dashboard Vercel → Analytics). **Premier mot de passe** pour les
  comptes sans mot de passe (lien magique / import) dans Mon espace → Sécurité (testé). **Géocodage au pays**
  (`pnpm geocode --pays`) : les profils importés qui n'ont qu'un pays sont placés au centre du pays → **245 profils
  géolocalisés sur 288 en prod** (43 sans pays ni ville restent hors carte). **Back-office complété** : attribution des
  rôles dans Paramètres (ADMIN seul ; garde-fous : pas d'auto-rétrogradation, dernier admin protégé ; prend effet à la
  prochaine connexion) + « Ajouter à l'équipe » par e-mail ; traitement des signalements (Clôturer / Retirer le contenu) ;
  modification d'une personnalité (`/admin/memoire/personnalites/[id]`) ; épinglage dans le ticker « En direct »
  (`featured`, partagé avec « À la une » de l'accueil). Plus aucune fonction « pas encore disponible » dans l'admin,
  sauf l'envoi de newsletter (Brevo) et le modèle « expert » (Compétences).

- **30/10 — corrections Josué.** « Avantages » devient **« Bons plans »** partout (nav, rubrique `/bons-plans` avec
  redirection permanente depuis `/avantages`, libellé du type DEAL, admin). **Section « Nos partenaires »** sur l'accueil
  (bande pleine largeur, 4 tuiles logo + accroche + lien compté, bouton « Devenir partenaire ») alimentée par les campagnes
  maison de la régie : un partenaire = un annonceur maison en diffusion, géré depuis /admin/regie. **Panneaux publicitaires**
  : formats agrandis façon affichage (haut/milieu/bas 970×250, latéral 300×600, mobile 360×200), angles droits, cadre
  fin, typographie plus grande, bouton personnalisable (`Banner.cta`, migration `banner_cta` local + Neon). **Copie
  réécrite** des 4 campagnes maison (titre, accroche, bouton : « Réserver le studio », « Embarquer », « Composer mon
  voyage », « Préparer mon séjour »). Photos recadrées 1940×500 et 600×1200.

- **30/10 — TRANSFERT AU HCBE (compte BDMSITE).** Dépôt GitHub transféré : **github.com/BDMSITE/bdm-web** (l'ancienne URL
  JOJODEVS-GIT redirige). Nouveau compte Vercel (connexion GitHub BDMSITE, équipe `bdmsite`), nouveau projet `bdm-web`
  (id prj_YaqJgMNr53qslvdTWfclRcDQRCFV) importé du dépôt, Node 24. **Nouvelle base Neon** `bdm-db` (Marketplace, gratuite,
  région us-east-1 par défaut) : migrations appliquées puis **restauration complète** de la sauvegarde de l'ancienne prod
  (947 lignes : 288 comptes, 35 contenus, 16 campagnes…) → données identiques. Nouveau coffre Blob privé `bdm-fichiers`,
  variables reposées (AUTH_SECRET et CRON_SECRET régénérés, AUTH_TRUST_HOST, EMAIL_FROM, CONTACT_EMAIL), cron de sauvegarde
  vérifié. **Prod : https://bdm-web-psi.vercel.app** (pages, CSP, partenaires, panneaux OK). Le CLI local est désormais
  connecté au compte BDMSITE (`--scope bdmsite`) ; le dossier est lié au nouveau projet. **L'ancien projet
  (jojo-devs-projects / bdm-web-jojo-devs-projects.vercel.app) reste en ligne en secours** jusqu'à validation de Josué,
  puis à supprimer (et ses ressources Neon/Blob). Reste à faire sur le nouveau compte : activer Web Analytics si pas déjà
  fait, poser les clés Turnstile (Cloudflare), Brevo, domaine beninois-du-monde.com.

- **30/10 — MODÈLE DE COMPTES SIMPLIFIÉ (décision Josué).** Deux sortes de personnes : **membre** et **administrateur**.
  L'inscription ne propose plus de type de compte ; « ce que je représente » (moi-même / entreprise / association /
  artiste ou groupe) est un **choix du profil**, modifiable, qui décide seulement de l'annuaire d'affichage
  (`User.accountType` conservé en base, tables de détails créées à la demande). Rôles visibles dans Paramètres :
  Membre, Administrateur (« Nommer un administrateur ») ; EDITOR/MODERATOR/REGIE restent dans l'enum mais ne sont plus
  proposés. Comptes de test rédaction / entreprise / association / artiste **supprimés** en prod et en local (seed
  aligné) ; il reste admin + 5 membres de démo. CGU et confidentialité mises à jour (un seul type de compte).
  Bande « Nos partenaires » : logo + nom seulement, 5 tuiles. En attente : e-mail de Mam pour son compte administrateur.

- **03/11 — TURNSTILE REFAIT.** Le widget Cloudflare avait été supprimé par erreur (les variables Vercel pointaient
  vers un widget inexistant → formulaires bloqués). Nouveau widget créé par Josué, clés reposées sur le projet bdmsite
  (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` lisible, `TURNSTILE_SECRET_KEY` sensible, prod + preview), secret validé auprès de
  Cloudflare, redéploiement de production READY (bdm-690h89nhi). À vérifier connecté en équipe : widget sur /inscription,
  alerte « Anti-robot » disparue dans Admin → Paramètres. Attention : `vercel env add` crée des variables *sensibles*
  (valeur non relisible) ; passer par l'API Vercel avec `type: encrypted` pour les clés publiques.

- **30/10 — TURNSTILE ACTIF.** Clés Cloudflare posées sur le projet bdmsite (prod + preview), widget « Vérifiez que vous
  êtes humain » visible sur /inscription et /contact, refus serveur vérifié (envoi sans jeton → « Vérification anti-robot
  échouée »). Domaines déclarés chez Cloudflare : bdm-web-psi.vercel.app et beninois-du-monde.com. Réseaux sociaux :
  **réglages du site en base** (`SiteSetting`, migration `site_settings` local + Neon) modifiables dans Admin → Paramètres →
  « Réseaux sociaux » (Facebook, LinkedIn, Instagram, X, YouTube, TikTok, WhatsApp) sans redéploiement ; tant qu'un lien est
  vide, l'icône reste visible et renvoie vers /contact (règle Josué : rien ne se retire, tout se configure). Paramètres
  affiche aussi une liste « À configurer » (Brevo, réseaux, MapTiler, FedaPay, newsletter, experts, accueil-hébergement). Base Notion « ✅ Vérification du site » :
  60 pages du site en ligne à vérifier par Josué (anciennes maquettes à la corbeille).

- **30/10 — BREVO BRANCHÉ + PARCOURS COMPLET VALIDÉ.** Clé API Brevo (restreinte : e-mails transactionnels + contacts)
  posée sur le projet bdmsite, expéditeur contact@beninois-du-monde.com, restriction IP désactivée côté Brevo par Josué,
  envoi direct de test réussi. **Authentification du domaine (DKIM/DMARC) reportée** jusqu'à l'accès DNS : d'ici là les
  e-mails partent mais risquent le dossier spam ; **pas d'envoi des 278 invitations avant** cette étape (décision Josué).
  Parcours complet testé en local : inscription → lien d'activation → espace membre → guichet Publier (annonce) →
  modération admin (Valider) → annonce visible dans la rubrique. Données de test supprimées.

- **30/10 — RÉFÉRENCEMENT, FLUX, ALERTES.** `/robots.txt` (admin, compte, api exclus), `/sitemap.xml` (pages fixes + contenus
  publiés + fiches annuaire), `/flux.xml` (RSS des 30 derniers contenus, utilisable par n8n/agrégateurs). **Alertes par
  mots-clés enfin envoyées** : cron Vercel `/api/cron/alertes` chaque jour 06:00 UTC → pour chaque alerte, les contenus
  publiés depuis le dernier envoi portant un mot-clé suivi et d'un type suivi, un e-mail par membre via Brevo
  (`sendAlertDigest`), `Alert.lastSentAt` mis à jour, rien envoyé s'il n'y a rien. Barre admin : bouton « Retour au site »
  visible à toute taille d'écran. Comptes : l'administrateur a aussi son espace membre (normal), les membres n'ont jamais
  accès au back-office (proxy).

- **30/10 (après-midi) — LES 7 OMISSIONS VALIDÉES + SUGGESTIONS, LIVRÉES.** Tout est en prod (commits 8acc55a → 7747430).
  1. **E-mails maison** : gabarit unique `layout()` dans `src/lib/mail.ts` (bande tricolore, fresque, titre, bouton vert,
     pied « Partenaire officiel du HCBE »), 10 messages réécrits ; aperçu : `pnpm tsx scripts/apercu-mails.ts dossier`.
  2. **Image de partage** `/api/og?t=&k=&s=` (Public Sans 800, composition drapeau, < 60 Ko pour WhatsApp) sur chaque contenu
     et chaque fiche membre ; `metadataBase`, OG/Twitter par défaut.
  3. **Manifest PWA** + icônes générées (`/api/icone`, `/apple-icon`).
  4. **Quota recruteurs** : `quota.offres` (3 par défaut) réglable dans Paramètres → Quotas, appliqué à la publication.
  5. **Newsletter complète** : `/newsletter` (double confirmation, désinscription 1 clic), admin : composer un numéro (contenus
     cochés), Envoyer / Continuer, reprise automatique par le cron dans la limite `quota.mails.jour` (250).
  6. **Compétences** : le membre propose (`/compte/competences`), l'équipe valide (`/admin/competences`), page publique
     alimentée, badge « Expert validé par le HCBE » sur la fiche. **Accueil & hébergement** : fiche membre
     (`/compte/accueil`), relecture dans Admin → Services, page publique alimentée. Contacts via messagerie relais.
  7. **Rapport annonceurs** : CSV 90 j (Admin → Régie) + e-mail mensuel le 1er à CONTACT_EMAIL.
  Suggestions : accusé de candidature au candidat, hebdo « près de chez vous » (lundi, abonnés à la lettre avec un pays),
  rappel unique de profil incomplet (lundi), export CSV de l'annuaire (Admin → Communauté), **afficher / masquer le mot de
  passe** sur les 9 champs. Migrations `newsletter_intro` et `experts_accueil` appliquées en local et sur Neon.
  **Adhésion payante : en attente de la réponse du HCBE** (obligatoire ou optionnelle ?) — page Notion « 💳 Adhésion & accès ».

- **30/10 (soir) — RELECTURE INDÉPENDANTE DE TOUT LE SITE, 25 CORRECTIONS.** Un agent relecteur a passé le projet
  (bugs, manques, sécurité, accessibilité). Corrigé et déployé : images de couverture externes (plus de 500),
  liens de recherche et de fiche membre vers la bonne fiche, carte avec les profils géolocalisés au pays, lien magique
  d'une adresse inconnue → « créez votre compte » (plus de compte fantôme sans profil), inscription : secteur
  facultatif et pays libre avec suggestions (fini « Informatique » et « Bénin » par défaut), offres de la rédaction
  avec lien de candidature externe, **signalement de contenu** (bouton sous chaque fiche → file Modération),
  **statut de candidature** mis à jour par le recruteur, compteur de vues, alerte « immédiate » retirée, bouton
  « Créer une alerte » relié, accueil : experts validés, « Voir sur la carte » → ancre, collision de slug à
  l'inscription, libellés d'audit, coquilles. Sécurité : **rôle et statut relus en base toutes les 5 min**
  (suspension immédiate), session 7 jours, **remise à zéro de la 2FA par un admin** (Paramètres), CV « visibles des
  recruteurs » réservés aux comptes entreprise + équipe, **mot de passe exigé pour supprimer son compte**,
  « afficher / masquer le mot de passe ». Accessibilité : contraste du gris (AA), focus clavier visible, lien
  « Aller au contenu », étiquettes des champs de recherche.
  **Reste à décider (voir les suggestions du 30/10 dans Notion / message à Josué)** : pagination, recherche dans
  l'admin Communauté, e-mail au membre après modération, photo de profil, fuseaux horaires des événements,
  partage WhatsApp, pages pays, guides de démarches, Gitleaks en CI.

- **30/10 (nuit) — LES 7 CHANTIERS VALIDÉS PAR JOSUÉ, LIVRÉS.** 1) modération : refus avec motif, e-mail « publié / non
  retenu » à l'auteur, motif visible dans Mes publications ; 2) admin Communauté : recherche (nom, e-mail, ville),
  filtres type / statut, pagination par 50 ; 3) profil : photo (Blob public, 2 Mo), fonction, détails entreprise /
  association / artiste, avatars partout ; 4) référentiel pays (`src/lib/pays.ts`) : suggestions Pays + Ville
  (Nominatim) dans tous les formulaires, normalisation à l'enregistrement ; 5) événements : fuseau horaire du lieu
  (`EventDetails.timezone`), affichage « 19:00 (Montréal) · 01:00 à Cotonou », « Ajouter à mon agenda » (.ics, Google),
  calendrier abonnable `/agenda/ical` ; 6) partage WhatsApp / copie de lien, formulaire « Je cherche un expert »,
  pages pays `/pays` + `/pays/[slug]`, guides de démarches `/pratique/demarches` (articles tagués « Démarches ») ;
  7) Gitleaks sur GitHub Actions (`.github/workflows/gitleaks.yml`, dépôt public). Migrations `moderation_note` et
  `event_timezone` appliquées en local et sur Neon.

- **31/10 — LES « RESTANTS » DE LA RELECTURE, LIVRÉS.** Suppression de compte complète (contenus archivés, messages,
  favoris, candidatures, fiche d'accueil, photo, blocages) et export RGPD complet ; mots-clés : renommer, fusionner
  (contenus, profils, alertes déplacés), supprimer (Admin → Mots-clés → Gérer) ; messagerie : blocage d'un membre,
  lecture au clic seulement, pastille « non lus » dans l'en-tête ; pagination des rubriques (30) et des annuaires (24/30) ;
  carte des contenus par thème (membres, afrodescendants, associations, bonnes adresses, événements) avec géocodage
  automatique à la publication ; **ambassades et consulats** saisis dans Admin → Ambassades & consulats, affichés sur
  /hcbe et chaque page pays (vide tant que le HCBE n'a rien saisi) ; **version anglaise** : /en/join, /en/sign-in,
  /en/community (+ /en/roots), formulaire d'inscription bilingue, retours de connexion dans la bonne langue, lien
  « English » dans le pied de page. Migrations `user_block` et `consulats` appliquées en local et sur Neon.
  L'espace membre et le back-office restent en français (décision : gros chantier, à part).

- **02/11 — LE SITE EST SUR SON DOMAINE : https://beninois-du-monde.com.** Domaine Hostinger pointé sur Vercel
  (2 A + CNAME www + 2 TXT _vercel saisis par Josué, nameservers et boîte mail Hostinger conservés), certificat délivré,
  www → apex et bdm-web-psi.vercel.app → domaine en 308. `AUTH_URL` et `NEXT_PUBLIC_SITE_URL` posés en production.
  L'ancien WordPress n'est plus servi (à supprimer de l'hébergement Hostinger quand Josué veut). **Reste** : SPF avec
  `include:spf.brevo.com` + authentification du domaine dans Brevo (DKIM / DMARC), Turnstile : ajouter le domaine
  dans le widget Cloudflare.

- **02/11 — MODE MAINTENANCE.** Admin → Paramètres → carte « Maintenance » (ADMIN seul) : case « Fermer le site aux
  visiteurs » + message. Les visiteurs voient une page d'attente (noindex) sur toutes les pages publiques ; /connexion,
  /en/sign-in, /admin et /api restent ouverts ; l'équipe connectée voit le site normalement avec un bandeau rouge.
  Réglage `maintenance` / `maintenance.message` en base (SiteSetting), journalisé. Au passage : le proxy applique
  désormais lui-même les règles d'accès (/admin réservé à l'équipe, /compte aux connectés) sur toutes les pages et
  transmet le chemin au layout (x-pathname). **Site mis en maintenance le 02/11 à la demande de Josué.**

- **02/11 — SÉCURITÉ & VALIDATION, PILOTABLES.** Paramètres → carte « Sécurité & validation » (ADMIN) : (1) **2FA
  obligatoire pour l'équipe** : sans TOTP, toute entrée dans /admin redirige vers Sécurité avec un message ; (2) **validation
  des fiches pro** : une fiche entreprise / association / artiste n'apparaît dans son annuaire qu'après « Valider la
  fiche » (Admin → Communauté, filtre « Fiches pro à valider », pastille dans la barre), e-mail au membre à la validation,
  notice dans son profil. Champ `Profile.proVerifiedAt` (migration `pro_verified`, locale + Neon). Les deux
  interrupteurs sont **désactivés par défaut** : à activer avant l'ouverture.

- **02/11 — NOUVELLES FONCTIONS (idées validées « go »).** Photos / visuels sur les contenus des membres (publier et
  modifier, Blob public 3 Mo) ; page publique **/chiffres** (membres par pays et secteur, inscriptions sur 12 mois,
  contenus, calculé en direct) ; **Inviter mes proches** (/compte/inviter : 5 e-mails à la fois, 20/jour, message
  personnel, lien WhatsApp) ; **tableau de bord mensuel** envoyé au HCBE le 1er (inscrits, actifs, pays, publications,
  messages, candidatures, abonnés, experts, régie) ; **« J'y vais »** sur les événements (compteur, liste des
  participants pour l'organisateur et l'équipe, rappel automatique la veille par le cron) ; **sections locales du HCBE**
  (Admin → Sections locales HCBE : pays, ville, nom, présentation, responsable joignable par la messagerie relais, site),
  affichées sur /hcbe et sur chaque page pays. Migration `rsvp_sections` (locale + Neon).
- **03/11 — LES 4 IDÉES VALIDÉES (« ok on fait les 4 idées, go »).** Migration `anciens_entraide_recommandations`
  (locale + Neon). (1) **Anciens élèves & promotions** : Mon profil public → bloc « Formation » (jusqu'à 4 lignes :
  école, filière, année de sortie, table `Education`) ; page publique **/communaute/anciens** (écoles regroupées,
  recherche, puis membres d'une école filtrables par promo) ; section « Formation » sur la fiche membre avec « N autres
  anciens » ; lien depuis l'annuaire et le menu Communauté. (2) **Entraide** : la rubrique « Chercher / trouver »
  devient « Entraide : chercher / trouver » (table `HelpDetails` : besoin / offre, catégorie parmi 9, urgent, résolu) ;
  onglets Besoins / Offres + filtre catégorie ; badge rouge « Urgent » ; CTA « Proposer mon aide » / « Demander cette
  aide » ; **volontaires par ville** (Mes alertes → « Entraide près de chez moi », `Profile.helpVolunteer`) prévenus par
  e-mail à la publication d'un besoin dans leur ville (`notifyHelpVolunteers`, 200 max) ; bouton « C'est résolu »
  dans Mes publications (archive + `resolvedAt`). Les 10 mises en relation importées (SIAL) ont été rattachées à
  Besoin / Mise en relation. (3) **Recommandations entre membres** (table `Recommendation`) : un membre recommande
  un autre membre ou une bonne adresse (20–400 caractères, une par cible, modifiable, retirable) ; passage par
  Admin → Modération (carte « Recommandations en attente », pastille) sauf si l'interrupteur « Publier les
  recommandations sans relecture » est activé dans Paramètres ; affichage sur la fiche membre (badge « Recommandé·e
  par N membres » + liste), sur la fiche adresse, et pastille « N recommandations » dans l'annuaire ; e-mail au membre
  recommandé. (4) **Lecture hors ligne des guides** : service worker `public/sw.js` (réseau d'abord ; navigations
  privées jamais mises en cache) ; bouton « Lire hors ligne » sur /pratique/demarches et sur tout article tagué
  « demarches » ; liste « Mes guides hors ligne » (localStorage) ; page /hors-ligne servie sans réseau. Testé en build
  de production : serveur arrêté → guide enregistré lisible et stylé, autres pages → page d'attente.
  Libellé du type HELP_REQUEST renommé « Entraide ». Export RGPD et suppression de compte couvrent formation et
  recommandations. Lanceur local supplémentaire `bdm-prod` (pnpm start) dans .claude/launch.json.

- **04/11 — RÉFÉRENTIEL NUMÉROTÉ DES FONCTIONNALITÉS.** `FONCTIONNALITES.md` à la racine : 160 fonctionnalités F-001 → F-160
  en 12 familles (comptes, site public, rubriques, communauté, espace membre, modération, gestion, paramètres, e-mails,
  régie, sécurité/exploitation, en attente), chacune avec emplacement, accès (V/M/E/A/S) et état (139 ✅, 16 ⚙️, 4 ⏸️, 1 ✖).
  Numéros définitifs : une nouveauté prend le numéro suivant, un retrait garde son numéro. Copie dans Notion.

- **04/11 — CONFIGURATION FINALE + FAVICON.** Brevo : domaine authentifié (code Brevo, DKIM brevo1/brevo2, DMARC avec
  rua, SPF `include:spf.brevo.com`), vérifié vert ; en-têtes Hostinger `dkim=pass dmarc=pass spf=pass` ; test « de moi à
  moi » vers la boîte Hostinger classé spam par le filtre de contenu (liens de suivi Brevo + expéditeur = destinataire),
  test vers Gmail reçu en boîte de réception → OK. Les 6 comptes de démo supprimés de la prod (reste l'admin
  contact@beninois-du-monde.com + 278 importés). Correction : message « Lien envoyé ! » après lien magique (Auth.js
  collait `?provider=…` à l'URL de retour). **Favicon** : l'ancien était celui de Create Next App ; nouveau dessin =
  « B » du logo (Public Sans 800, vert-900) + bande tricolore, fichiers statiques `src/app/favicon.ico` (16/32/48),
  `icon.png` (512), `apple-icon.png` (180), `public/icons/*` pour le manifest ; générateurs dynamiques
  `/api/icone` et `apple-icon.tsx` supprimés. Reste côté Josué : 2FA perso + réglages Sécurité & validation,
  suppression de l'ancien projet Vercel / Neon / Blob sur le compte perso, contenus officiels, réouverture.

- **04/11 — REVUE DE LA BASE MEMBRES + NETTOYAGE NEON.** Favicon : première version (fond blanc) validée par Josué.
  Comparaison Excel « Base de Données BIG DATA PERSO MAJ NOV 2020.xlsx » ↔ Neon : 427 contacts « général », 278 avec
  e-mail = les 278 comptes PENDING_EMAIL (0 manquant), 149 sans e-mail (non importables), 43 importés sans pays,
  116 pays interprétés depuis une saisie libre ; presse 19 (17 abonnés) et coop. décentralisée 12 (3 abonnés).
  Fichier de revue remis à Josué (`Revue-membres-HCBE-2026-11-04.xlsx`, onglets Importés / Sans e-mail / Sans pays /
  Pays à vérifier / Presse / Coop. déc., colonnes « → » à corriger) ; à son retour, réinjecter les corrections puis
  envoyer les invitations (lots de 50 à 250, quota Brevo 300/jour, relance auto à 7 jours). Schéma `neon_auth`
  (9 tables vides créées par Neon Auth le 30/10, jamais utilisées) supprimé sur Neon : seul `public` reste ; si Neon
  le recrée, désactiver Neon Auth dans la console Neon (branche → Auth). 2FA et interrupteurs Sécurité : le HCBE les
  activera lui-même ; ancien projet Vercel perso : supprimé par Josué.

- **05/11 (soir) — ADHÉSION HCBE CODÉE (F-156).** Go de Josué ; client : encaissement en FCFA accepté, prix affiché
  selon le pays du membre, compte FedaPay = compte personnel de l'administrateur. Livré : modèle `Membership`
  (plan ANNUEL / ETUDIANT / HONNEUR, statut PENDING / ACTIVE / EXPIRED / CANCELLED, montant XOF, paymentRef unique),
  `src/lib/adhesion.ts` (devise par pays : FCFA zone franc, $ US, $ CA, € ailleurs ; parité 655,957 ; Mobile Money
  par pays ; `isAdherent`, `activerAdhesion` idempotente, renouvellement enchaîné), `src/lib/fedapay.ts` (REST
  transactions + token, relecture, signature webhook HMAC-SHA256 `t=…,s=…` sur `${t}.${corps}` tolérance 5 min,
  sandbox/live selon préfixe de clé), page `/compte/adhesion` (statut, tarifs, moyens de paiement du pays, déclaration
  sur l'honneur pour le tarif réduit), `/compte/adhesion/payer` (widget FedaPay Checkout.js v1.1.7 sur la transaction
  créée côté serveur + lien de repli), `/compte/adhesion/retour` (relit la transaction, jamais le `status` de l'URL),
  webhook `/api/fedapay/webhook` (signature puis relecture à la source, montant vérifié), e-mails reçu + rappel J-30,
  cron : échues → EXPIRED, PENDING > 2 j → CANCELLED, rappel unique 30 j avant (`reminderSentAt`), Admin → Adhésions
  (stats, liste filtrée, activation manuelle, retrait, export CSV), badge « Membre HCBE » (profil, annuaire, menu),
  réservés : codes des bons plans, offres au-delà du quota. Réglages : interrupteur `adhesion.proposer` (OFF par
  défaut : page et badge masqués) + prix € / $ US / $ CA dans Paramètres → Quotas. **Deux jeux de clés** (demande
  Josué) : `FEDAPAY_SANDBOX_PUBLIC_KEY` / `_SECRET_KEY` / `_WEBHOOK_SECRET` et `FEDAPAY_LIVE_*` ; interrupteur
  `paiement.live` « KKiaPay : encaisser pour de vrai » (OFF = sandbox, sans effet si clés live absentes) ;
  `Membership.live` distingue les transactions réelles des tests (stats admin hors tests, badge « Test »).
  **Correction 05/11 (soir) : le compte du HCBE est chez KKiaPay, pas FedaPay** → couche de paiement remplacée :
  `src/lib/kkiapay.ts` (vérification POST `/api/v1/transactions/status` avec x-api-key / x-private-key /
  x-secret-key, sandbox `api-sandbox.kkiapay.me`), widget `cdn.kkiapay.me/k.js` ouvert sur le site (montant figé
  côté serveur, `data` = id d'adhésion), le navigateur transmet le `transactionId` → action `confirmPaymentAction`
  → vérification serveur (statut SUCCESS, montant, stateData) ; webhook `/api/kkiapay/webhook` (en-tête
  `X-KKIAPAY-SECRET` = hash choisi dans le tableau de bord, puis même vérification). Clés : `KKIAPAY_SANDBOX_PUBLIC_KEY`
  / `_PRIVATE_KEY` / `_SECRET_KEY` / `_WEBHOOK_SECRET` et `KKIAPAY_LIVE_*`. KKiaPay = XOF seul ; pays Mobile Money :
  BJ, CI, TG, SN, NE ; carte partout. Josué pose les clés sandbox directement dans Vercel + `.env` (jamais dans le chat).
  **Puis (même soir) : le HCBE aurait aussi un compte Stripe → deux prestataires combinés** (`src/lib/paiement.ts`) :
  zone franc → KKiaPay (Mobile Money, carte, wallet, FCFA) ; reste du monde → **Stripe Checkout** (carte en €, $ US,
  $ CA au prix affiché, sans conversion) ; repli KKiaPay-carte si Stripe absent. `src/lib/stripe.ts` (REST : session
  Checkout, relecture, signature `Stripe-Signature` v1 HMAC-SHA256), webhook `/api/stripe/webhook`
  (checkout.session.completed), `Membership.provider` (KKIAPAY | STRIPE | null manuel), `amount` = FCFA (KKiaPay) ou
  centimes (Stripe), stats admin groupées par devise. Clés : `STRIPE_TEST_SECRET_KEY` / `_WEBHOOK_SECRET`, `STRIPE_LIVE_*`.
  Un seul interrupteur test / réel `paiement.live` pour les deux. Testé en local :
  activation manuelle, reçu, badge, code réservé, webhook (signature OK/KO), cron (expiration + rappel), export.
  Non testé faute de clés : paiement réel sandbox (widget + retour + webhook FedaPay).

## Ce qui RESTE (ordre)
1. **Josué / HCBE** : corrections éventuelles du fichier de revue (colonnes « → ») → réinjection ; **les 149 sans e-mail sont ignorés (décision Josué 05/11)** ;
   saisies admin (textes /hcbe, sections locales, consulats, réseaux sociaux, directeur de publication + juridiction,
   fiches « Béninois qui comptent », relecture des lieux de mémoire) ; 2FA perso puis « 2FA obligatoire » et
   « Validation des fiches pro » dans Paramètres ; rôle Régie à la personne du HCBE.
2. **Adhésion (F-156) : codée le 05/11, à brancher (KKiaPay).** (a) Josué pose les clés **sandbox**
   (`KKIAPAY_SANDBOX_PUBLIC_KEY` / `_PRIVATE_KEY` / `_SECRET_KEY`) dans Vercel et `.env`, déclare le webhook
   `https://beninois-du-monde.com/api/kkiapay/webhook` (Développeurs → Clés API → Webhook, événement
   transaction.success, hash secret → `KKIAPAY_SANDBOX_WEBHOOK_SECRET`) ; test d'un paiement sandbox de bout en bout
   (numéro MTN test 22961000000) ; (b) clés **live** (`KKIAPAY_LIVE_*`, webhook live) puis cocher « KKiaPay :
   encaisser pour de vrai » ; (c) activer « Proposer l'adhésion HCBE » (propriétaire, fin de projet). Migrations
   `adhesion`, `adhesion_live` et `adhesion_provider` déjà appliquées sur Neon. **Stripe** : `STRIPE_TEST_SECRET_KEY`
   + webhook test `https://beninois-du-monde.com/api/stripe/webhook` (checkout.session.completed) →
   `STRIPE_TEST_WEBHOOK_SECRET` ; test carte 4242 4242 4242 4242 ; puis clés live. **Décision Josué 05/11 : pas de KYC
   automatique à l'inscription des membres** (e-mail confirmé + validation HCBE des fiches pro + modération + le
   paiement d'adhésion vaut vérification ; Smile ID seulement si une fonction l'exige un jour). Consignée dans le
   Journal des décisions Notion. **Autres décisions en attente** (F-141 pub
   FedaPay, F-157 anglais, F-158 Meilisearch) : rien à coder tant qu'elles ne sont pas prises.
3. **Clôture** : fin du mode maintenance (Paramètres → Maintenance), test complet inscription → activation →
   publication, puis envoi des 278 invitations depuis /admin/imports (en tout dernier).

## Conventions de travail (Josué)
- Chaque correction : vérifier au navigateur (+ mobile 390px si UI), lint+tsc, commit clair FR, push (→ Vercel auto)
- Tout consigner dans Notion : décisions → Journal, tâches → Étapes, revue → Vérification, réunions → Comptes rendus
- Ne PAS élargir ses demandes (il l'a recadré une fois) ; proposer avant d'ajouter
- Données d'exemple marquées comme telles ; jamais d'e-mail exposé (relais) ; français partout

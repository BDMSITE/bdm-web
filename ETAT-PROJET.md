# ÉTAT DU PROJET — Béninois du Monde

> ⚠️ **Claude : lis ce fichier en début de session et METS-LE À JOUR à chaque étape franchie.**
> Il est la mémoire du projet en cas de compactage de contexte. Dernière mise à jour : **22/09/2026**.

## Le projet en une phrase
Média + réseau de la diaspora béninoise pour le HCBE, calqué sur reunionnaisdumonde.com,
from scratch en Next.js — remplace l'ancien WordPress de beninois-du-monde.com (audit 14/09/2026).

## 📍 NIVEAU ACTUEL : maquette 100 % terminée, hébergée, en revue HCBE
**Prochaine étape : SOCLE TECHNIQUE (S1)** — plan détaillé dans Notion « 🏗️ Socle technique ».
En attente : prérequis Josué (OrbStack, e-mail projet, comptes Vercel déjà OK/Neon/Resend/Brevo/MapTiler),
retours HCBE sur la maquette, atelier questionnaire (58 questions prêtes dans Notion).

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
- Règles UI actées : libellés courts/2-3 mots toujours en nowrap · cartes d'annuaire hauteurs égales pied calé ·
  largeur stable (main width:100%, scrollbar-gutter stable) · header/footer pleine largeur, contenu max-w-6xl
- Prisma 7 + Zod installés (schéma 20 entités écrit, prisma.config.ts), lucide-react, maplibre-gl
- CI GitHub Actions écrite mais **bloquée : Actions désactivé sur les repos privés du compte (facturation)** — repo passé public depuis ? vérifier
- .npmrc : fetch-timeout 10 min (connexion lente — les gros paquets échouent sinon)

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

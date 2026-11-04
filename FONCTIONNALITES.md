# Béninois du Monde — Référentiel numéroté des fonctionnalités

Version 1.0 — 04/11/2026 — site : https://beninois-du-monde.com (dépôt GitHub BDMSITE/bdm-web, hébergement Vercel équipe bdmsite).

Ce document liste **toutes** les fonctionnalités livrées, une ligne par fonctionnalité, avec un numéro stable (F-001…).
Il sert à la recette avec le HCBE, à la formation de l'équipe et à la facturation. Chaque numéro est définitif : une
fonctionnalité retirée garde son numéro (marquée « retirée »), une nouvelle reçoit le numéro suivant.

**Accès** · V = visiteur · M = membre connecté · E = équipe (administrateur, et rôles Régie / Rédaction / Modération si attribués) · A = administrateur seul · S = système (automatique).
**État** · ✅ en ligne · ⚙️ en ligne, demande un réglage ou une saisie du HCBE · ⏸️ en attente d'une décision · ✖ retirée sur décision.

---

## A. Comptes, connexion et accès

| N° | Fonctionnalité | Où | Accès | État |
|---|---|---|---|---|
| F-001 | Inscription : nom, e-mail, mot de passe, pays et ville avec suggestions, secteur facultatif, « ce que je représente » (moi-même, entreprise, association, artiste ou groupe) | /inscription | V | ✅ |
| F-002 | Activation du compte par lien envoyé par e-mail (compte inactif tant que l'adresse n'est pas confirmée) | e-mail | V | ✅ |
| F-003 | Connexion par mot de passe | /connexion | V | ✅ |
| F-004 | Connexion par lien magique (sans mot de passe) ; adresse inconnue → invitation à créer un compte, jamais de compte fantôme | /connexion | V | ✅ |
| F-005 | Connexion en deux étapes par code à usage unique (TOTP) pour les comptes qui ont activé la 2FA | /connexion/code | M | ✅ |
| F-006 | Déconnexion ; session de 7 jours ; rôle et statut relus en base toutes les 5 minutes (une suspension prend effet immédiatement) | — | M | ✅ |
| F-007 | Anti-robot Cloudflare Turnstile sur l'inscription, le contact, la newsletter et la demande d'expert ; refus serveur sans jeton valide | formulaires publics | V | ✅ |
| F-008 | Limitation des tentatives sans service externe : connexion 5/e-mail et 10/IP par quart d'heure, lien magique, inscription 5/IP/h, contact 5/IP/h, messages 20/h | — | S | ✅ |
| F-009 | Version anglaise des pages d'entrée : Join, Sign in, The community, Roots ; formulaire d'inscription bilingue, messages de connexion dans la langue choisie | /en/join · /en/sign-in · /en/community · /en/roots | V | ✅ |
| F-010 | Modèle de comptes simplifié : membre ou administrateur ; le type d'acteur (particulier, entreprise, association, artiste) est un choix du profil modifiable qui décide seulement de l'annuaire d'affichage | /compte/profil | M | ✅ |
| F-011 | Import des membres depuis le fichier Excel du HCBE (278 comptes importés, pays et villes normalisés, fonction et téléphone repris, rapport des lignes sans e-mail) | script `pnpm import:membres` | E | ✅ |
| F-012 | Envoi des invitations aux comptes importés par lots dans la limite Brevo, relance automatique après 7 jours | /admin/imports | E | ⚙️ attend l'authentification du domaine Brevo |
| F-013 | Mode maintenance : page d'attente pour les visiteurs (non indexée), message personnalisable, site normal pour l'équipe connectée avec bandeau rouge ; connexion, admin et API restent ouverts | Admin → Paramètres → Maintenance | A | ✅ (actif depuis le 02/11) |
| F-014 | Règles d'accès appliquées par le proxy sur toutes les pages : /admin réservé à l'équipe, /compte aux connectés, les membres n'entrent jamais dans le back-office | — | S | ✅ |

## B. Structure du site public

| N° | Fonctionnalité | Où | Accès | État |
|---|---|---|---|---|
| F-015 | Page d'accueil : À la une, derniers contenus par rubrique, carte, compétences validées, partenaires, panneaux publicitaires, inscription à la lettre | / | V | ✅ |
| F-016 | En-tête : recherche, logo, icônes réseaux sociaux, connexion / mon espace, barre de navigation verte avec bloc jaune « Emploi & Stages », fil d'Ariane, pastille messages non lus | toutes pages | V | ✅ |
| F-017 | Ticker « En direct » sous la navigation : derniers contenus publiés + messages épinglés par l'équipe, défilement avec pause au survol | toutes pages | V | ✅ |
| F-018 | Carte interactive MapLibre : membres géolocalisés (245 sur 288), filtres par thème (membres, afrodescendants, associations, bonnes adresses, événements), regroupement en grappes, repli / dépli, repli sans WebGL | accueil, rubriques | V | ✅ (fond OpenStreetMap ; MapTiler optionnel) |
| F-019 | Recherche globale avec facettes (type, lieu, mot-clé) ; Meilisearch si configuré, sinon recherche Postgres équivalente | /recherche | V | ✅ |
| F-020 | Pages par mot-clé : tous les contenus et profils portant un mot-clé | /mot/[slug] | V | ✅ |
| F-021 | Pages pays : liste des pays de la diaspora, puis membres, contenus, sections locales du HCBE et consulats du pays | /pays · /pays/[slug] | V | ✅ |
| F-022 | Page « Le HCBE » : présentation, sections locales, ambassades et consulats | /hcbe | V | ⚙️ textes et sections à saisir par le HCBE |
| F-023 | Pages légales : mentions légales (identité du HCBE vérifiée), politique de confidentialité (RGPD + APDP Bénin), CGU avec charte de la communauté | /legal/[slug] | V | ⚙️ nom du directeur de publication et juridiction à confirmer |
| F-024 | Formulaire de contact relais vers l'adresse du HCBE, sujets pré-remplis, anti-robot | /contact | V | ✅ |
| F-025 | Pied de page : colonnes de rubriques, réseaux sociaux, lien « English », pages légales, fresque de la diaspora | toutes pages | V | ✅ |
| F-026 | Réseaux sociaux configurables sans redéploiement (Facebook, LinkedIn, Instagram, X, YouTube, TikTok, WhatsApp) ; une icône sans lien renvoie vers le contact | Admin → Paramètres → Réseaux sociaux | A | ⚙️ liens à saisir |
| F-027 | Page 404 et page « Vous êtes hors connexion » | /hors-ligne | V | ✅ |
| F-028 | Mobile d'abord : navigation burger, colonne latérale en fin de page, aucun débordement horizontal, vérifié à 390 px | toutes pages | V | ✅ |
| F-029 | Accessibilité : contrastes AA, focus clavier visible, lien « Aller au contenu », champs étiquetés, animations réduites si demandé | toutes pages | V | ✅ |
| F-030 | Référencement : robots.txt (admin, compte, api exclus), sitemap.xml (pages, contenus publiés, fiches annuaire), métadonnées Open Graph / Twitter | /robots.txt · /sitemap.xml | S | ✅ |
| F-031 | Image de partage générée pour chaque contenu et chaque fiche membre (optimisée WhatsApp, < 60 Ko) | /api/og | S | ✅ |
| F-032 | Flux RSS des 30 derniers contenus (agrégateurs, n8n) | /flux.xml | V | ✅ |
| F-033 | Application installable (manifest PWA, icônes générées) | /manifest.webmanifest | V | ✅ |
| F-034 | Partage WhatsApp et copie de lien sur chaque fiche | fiches | V | ✅ |
| F-035 | Mesure d'audience Vercel Analytics (gratuit, sans cookie) | Vercel → Analytics | S | ⚙️ à activer d'un clic dans Vercel |
| F-036 | Page « La diaspora en chiffres » : membres par pays et secteur, inscriptions sur 12 mois, contenus publiés, calculée en direct | /chiffres | V | ✅ |
| F-037 | Section « Nos partenaires » de l'accueil, alimentée par les campagnes maison de la régie (logo + nom, lien compté, bouton « Devenir partenaire ») | / | V | ✅ |

## C. Rubriques de contenu

Règles communes à toutes les rubriques (F-038 à F-041), puis une ligne par rubrique.

| N° | Fonctionnalité | Où | Accès | État |
|---|---|---|---|---|
| F-038 | Toute liste : filtres (lieu, mots-clés, catégorie), compteur de résultats, pagination par 30, « Voir sur la carte », état vide honnête (jamais de fausse donnée) | rubriques | V | ✅ |
| F-039 | Toute fiche : lieu (pays, ville, carte), mots-clés cliquables, auteur, photo, date, compteur de vues, partage, signalement, favoris, « Écrire à l'auteur » par messagerie relais | /[rubrique]/[slug] | V / M | ✅ |
| F-040 | Tout contenu porte un lieu géocodé automatiquement à la publication et des mots-clés (secteur, lieu, thème) | — | S | ✅ |
| F-041 | Cycle de vie des contenus : brouillon, en modération, programmé, publié, refusé, expiré, archivé | — | S | ✅ |
| F-042 | Emploi & stages : offres de la rédaction et des recruteurs, filtres, fiche, candidature en ligne ou lien externe, quota d'offres gratuites par recruteur (3, réglable) | /emploi · /emploi/[slug] | V | ✅ |
| F-043 | Espace recruteur : règles de publication, quota, accès au guichet | /emploi/recruteurs | V | ✅ |
| F-044 | Agenda : événements avec fuseau horaire du lieu (« 19:00 (Montréal) · 01:00 à Cotonou »), « Ajouter à mon agenda » (.ics, Google), calendrier abonnable | /agenda · /agenda/[slug] · /agenda/ical | V | ✅ |
| F-045 | « J'y vais » sur les événements : compteur de participants, liste visible par l'organisateur et l'équipe, rappel automatique par e-mail la veille | /agenda/[slug] | M | ✅ |
| F-046 | Petites annonces (vente, logement, services…) | /annonces | V | ✅ |
| F-047 | Les bonnes adresses : lieux et commerces de la diaspora, avec recommandations des membres | /adresses | V | ✅ |
| F-048 | Bons plans & réductions (ex-« Avantages », ancienne adresse redirigée) | /bons-plans | V | ✅ |
| F-049 | Le magazine : articles de la rédaction et articles de membres relus | /magazine · /magazine/[slug] | V | ✅ |
| F-050 | Béninois qui comptent : personnalités (fiches créées et modifiées par l'équipe) | /magazine/beninois-qui-comptent | V | ⚙️ fiches à rédiger |
| F-051 | Mémoire & racines : lieux de mémoire (23 lieux et 2 itinéraires repris de l'ancien site, sources citées), guide nationalité (loi 2024-31), récit des Agudas, version anglaise Roots | /memoire · /memoire/[slug] · /en/roots | V | ⚙️ relecture historique des lieux |
| F-052 | Retour au pays : témoignages de membres rentrés, offres taguées « retour au pays », accompagnement du HCBE | /retour-au-pays | V | ✅ |
| F-053 | Entraide : chercher / trouver — besoins et offres d'aide, 9 catégories (hébergement d'urgence, traduction, démarches, santé, juridique, transport, rapatriement, mise en relation, autre), badge « Urgent », onglets Besoins / Offres, « Proposer mon aide » / « Demander cette aide » | /pratique/chercher-trouver | V | ✅ |
| F-054 | Volontaires d'entraide par ville : un membre se déclare volontaire et reçoit un e-mail à chaque besoin publié dans sa ville ; « C'est résolu » archive la demande | Mes alertes · Mes publications | M | ✅ |
| F-055 | Guides de démarches (articles tagués « Démarches ») avec lecture hors ligne | /pratique/demarches | V | ✅ |
| F-056 | Lecture hors ligne : bouton « Lire hors ligne » sur chaque guide, liste « Mes guides hors ligne », page d'attente sans réseau ; aucune page privée n'est jamais mise en cache | /pratique/demarches · /hors-ligne | V | ✅ |
| F-057 | Accueil & hébergement : offres d'accueil des membres (chambre, logement, famille) relues par l'équipe, contact par messagerie relais | /pratique/accueil | V | ✅ |
| F-058 | Compétences de la diaspora : experts validés par le HCBE, formulaire « Je cherche un expert » | /communaute/competences | V | ✅ |

## D. Communauté et annuaires

| N° | Fonctionnalité | Où | Accès | État |
|---|---|---|---|---|
| F-059 | Annuaire des membres : filtres pays, ville, secteur ; badges « Afrodescendant·e », « Expert validé par le HCBE », pastille « N recommandations » ; pagination par 24 ; seuls les comptes activés et visibles y figurent | /communaute/membres | V | ✅ |
| F-060 | Fiche membre publique : identité, photo, fonction, lieu, secteur, mots-clés, formation avec « N autres anciens », recommandations reçues, CV si rendu visible, « Écrire » par relais, carte | /communaute/membres/[slug] | V | ✅ |
| F-061 | Annuaire des entreprises (fiche : raison sociale, secteur, site, description) | /communaute/entreprises | V | ✅ |
| F-062 | Annuaire des associations | /communaute/associations | V | ✅ |
| F-063 | Annuaire des artistes et groupes | /communaute/artistes | V | ✅ |
| F-064 | Validation des fiches pro avant parution dans les annuaires (interrupteur), e-mail au membre à la validation | Admin → Communauté · Paramètres | A | ⚙️ à activer avant l'ouverture |
| F-065 | Anciens élèves & promotions : écoles regroupées, recherche, membres d'une école filtrables par année de sortie | /communaute/anciens | V | ✅ |
| F-066 | Recommandations entre membres : recommander un membre ou une bonne adresse (20 à 400 caractères, une par cible, modifiable, retirable), badge « Recommandé·e par N membres », e-mail au membre recommandé | fiches membres et adresses | M | ✅ |
| F-067 | Relecture des recommandations avant publication, désactivable par l'interrupteur « Publier sans relecture » | Admin → Modération · Paramètres | E | ✅ |
| F-068 | Sections locales du HCBE : pays, ville, nom, présentation, responsable joignable par relais, lien ; affichées sur /hcbe et les pages pays | Admin → Sections locales | E | ⚙️ à saisir |
| F-069 | Ambassades et consulats du Bénin, affichés sur /hcbe et les pages pays | Admin → Ambassades & consulats | E | ⚙️ à saisir |
| F-070 | Page annonceurs & partenaires : formats réels des 4 emplacements, contact | /annonceurs | V | ✅ |
| F-071 | Export CSV de l'annuaire | Admin → Communauté | E | ✅ |

## E. Espace membre (« Mon espace »)

| N° | Fonctionnalité | Où | Accès | État |
|---|---|---|---|---|
| F-072 | Tableau de bord du membre : raccourcis, messages non lus, publications, candidatures | /compte | M | ✅ |
| F-073 | Mon profil public : identité, fonction, pays et ville (géocodés), secteur, mots-clés, présentation, photo (2 Mo), « ce que je représente » avec détails entreprise / association / artiste, badge afrodescendant, visibilité dans l'annuaire, visibilité du CV | /compte/profil | M | ✅ |
| F-074 | Formation : jusqu'à 4 lignes (école, filière, année de sortie) alimentant les anciens élèves | /compte/profil#formation | M | ✅ |
| F-075 | Guichet « Publier » : annonce, événement, bonne adresse, bon plan, offre d'emploi ou de stage, article, demande ou offre d'entraide, témoignage de retour ; photo ; lieu et mots-clés obligatoires ; passage en modération | /publier | M | ✅ |
| F-076 | Mes publications : liste avec statut, motif de refus visible, modifier, retirer, republier (retour en modération), « C'est résolu » pour l'entraide | /compte/publications · /compte/publications/[id] | M | ✅ |
| F-077 | Mes messages : fils de discussion par contenu ou par membre, lecture au clic, blocage et déblocage d'un membre, pastille non lus | /compte/messages | M | ✅ |
| F-078 | Mes candidatures : suivi des offres auxquelles j'ai postulé et de leur statut | /compte/candidatures | M | ✅ |
| F-079 | Candidatures reçues (recruteur) : CV, message, changement de statut, réponse par relais | /compte/candidatures-recues | M | ✅ |
| F-080 | Mon CV : dépôt PDF (3 Mo) dans un coffre privé ou lien externe, visible seulement de moi, de l'équipe, des recruteurs ayant reçu ma candidature, et des comptes entreprise si je l'autorise | /compte/cv · /api/cv/[id] | M | ✅ |
| F-081 | Mes alertes : mots-clés et types suivis, e-mail quotidien des nouveautés | /compte/alertes | M | ✅ |
| F-082 | « Entraide près de chez moi » : interrupteur volontaire (exige une ville renseignée) | /compte/alertes#entraide | M | ✅ |
| F-083 | Mes favoris | /compte/favoris | M | ✅ |
| F-084 | Mes compétences pour le Bénin : proposer son expertise, suivre la validation, se retirer | /compte/competences | M | ✅ |
| F-085 | Ma fiche d'accueil : proposer un hébergement (chambre, logement, famille), relecture par l'équipe, retrait | /compte/accueil | M | ✅ |
| F-086 | Inviter mes proches : 5 e-mails à la fois, 20 par jour, message personnel, lien WhatsApp | /compte/inviter | M | ✅ |
| F-087 | Sécurité : changer le mot de passe, définir un premier mot de passe (comptes importés ou lien magique), afficher / masquer les mots de passe | /compte/securite | M | ✅ |
| F-088 | Double authentification TOTP : QR code, clé manuelle, premier code, désactivation par mot de passe + code ; compatible Google Authenticator, Authy, Bitwarden, 1Password | /compte/securite/2fa | M | ✅ |
| F-089 | Mes données : export RGPD complet (JSON) et suppression du compte protégée par mot de passe (contenus archivés, messages, favoris, candidatures, fiche d'accueil, photo, formation, recommandations effacés) | /compte/donnees · /api/compte/export | M | ✅ |
| F-090 | Postuler à une offre avec CV pré-rempli, accusé de réception par e-mail | /emploi/[slug] | M | ✅ |
| F-091 | Écrire à un membre ou répondre à une offre / annonce / demande sans jamais voir l'adresse e-mail (messagerie relais, notification e-mail) | fiches | M | ✅ |
| F-092 | Signaler un contenu (file de modération) | fiches | M | ✅ |

## F. Modération et rédaction

| N° | Fonctionnalité | Où | Accès | État |
|---|---|---|---|---|
| F-093 | File de modération : tout contenu de membre passe par « En modération » ; Publier / Refuser avec motif ; e-mail « publié » ou « non retenu » à l'auteur | /admin/moderation | E | ✅ |
| F-094 | Traitement des signalements : clôturer ou retirer le contenu | /admin/moderation | E | ✅ |
| F-095 | Recommandations en attente : publier ou rejeter, e-mail au membre recommandé | /admin/moderation | E | ✅ |
| F-096 | Rédaction : création d'articles du magazine, mise à la une, épinglage dans le ticker | /admin/redaction | E | ✅ |
| F-097 | Emploi : offres de la rédaction avec lien de candidature externe | /admin/emploi | E | ✅ |
| F-098 | Nouveau contenu depuis l'admin : adresse, événement, bon plan, annonce, entraide, lieu de mémoire, personnalité, offre | /admin/* | E | ✅ |
| F-099 | Édition de tout contenu : statut, lieu géocodé, coordonnées, détails par type, photo, journal d'audit | /admin/contenus/[id] | E | ✅ |
| F-100 | Mémoire & HCBE : lieux de mémoire et personnalités (créer, modifier) | /admin/memoire · /admin/memoire/personnalites/[id] | E | ✅ |
| F-101 | En direct : messages épinglés dans le ticker + flux automatique des derniers contenus | /admin/direct | E | ✅ |
| F-102 | Mots-clés : créer, renommer, fusionner (contenus, profils et alertes déplacés), supprimer | /admin/mots-cles | E | ✅ |

## G. Gestion de la communauté et des services

| N° | Fonctionnalité | Où | Accès | État |
|---|---|---|---|---|
| F-103 | Communauté : recherche (nom, e-mail, ville), filtres type / statut, pagination par 50, activer / suspendre un compte, valider les fiches pro, export CSV | /admin/communaute | E | ✅ |
| F-104 | Compétences : valider ou refuser les experts, mises en relation « Je cherche un expert » | /admin/competences | E | ✅ |
| F-105 | Services : relecture des fiches d'accueil & hébergement | /admin/services | E | ✅ |
| F-106 | Imports : état des comptes importés, envoi des invitations par lots, relance | /admin/imports | E | ⚙️ |
| F-107 | Statistiques : inscrits, actifs, pays, publications, messages, candidatures, abonnés | /admin/statistiques | E | ✅ |
| F-108 | Journal d'activité : toutes les actions de l'équipe horodatées (modération, rôles, réglages, régie, 2FA…) | /admin/journal | E | ✅ |
| F-109 | Tableau de bord admin : compteurs, files d'attente, raccourcis ; pastilles « à traiter » dans la barre ; bouton « Retour au site » | /admin | E | ✅ |

## H. Paramètres du site (sans redéploiement)

| N° | Fonctionnalité | Où | Accès | État |
|---|---|---|---|---|
| F-110 | Rôles et équipe : nommer un administrateur, ajouter à l'équipe par e-mail ; garde-fous (pas d'auto-rétrogradation, dernier administrateur protégé) | /admin/parametres | A | ✅ |
| F-111 | Remise à zéro de la 2FA d'un membre de l'équipe | /admin/parametres | A | ✅ |
| F-112 | Quotas : offres gratuites par recruteur (3), e-mails de masse par jour (250, limite Brevo gratuite 300) | /admin/parametres | A | ✅ |
| F-113 | Sécurité & validation : 2FA obligatoire pour l'équipe ; validation des fiches pro ; recommandations sans relecture | /admin/parametres | A | ⚙️ activer 2FA + validation pro avant l'ouverture |
| F-114 | Maintenance : fermer le site aux visiteurs, message | /admin/parametres | A | ✅ |
| F-115 | Réseaux sociaux (7 liens) | /admin/parametres | A | ⚙️ |
| F-116 | Liste « À configurer » : rappelle ce qui manque (Brevo, Turnstile, MapTiler, FedaPay, réseaux…) | /admin/parametres | A | ✅ |

## I. E-mails, newsletter et automatismes

Tous les e-mails utilisent un gabarit maison unique (bande tricolore, fresque, bouton vert, pied « Partenaire officiel du HCBE »). Envoi par Brevo ; sans clé, ils s'affichent dans les journaux du serveur.

| N° | Fonctionnalité | Où | Accès | État |
|---|---|---|---|---|
| F-117 | E-mails de compte : lien magique, confirmation d'inscription, invitation (import), invitation d'un proche | S | S | ✅ |
| F-118 | E-mails de relais : message de contact au HCBE, notification d'un message reçu, accusé de candidature | S | S | ✅ |
| F-119 | E-mails de suivi : résultat de modération, fiche pro validée, demande d'expert, avis de recommandation, alerte d'entraide (volontaires) | S | S | ✅ |
| F-120 | Newsletter : inscription en double confirmation, désinscription en un clic, page d'abonnement | /newsletter · /newsletter/confirmer · /newsletter/desinscription | V | ✅ |
| F-121 | Composer et envoyer un numéro (contenus cochés, introduction), envoi par lots repris automatiquement dans la limite quotidienne | /admin/newsletter | E | ✅ |
| F-122 | Alertes par mots-clés : chaque matin, un e-mail par membre avec les nouveautés qui correspondent à ses alertes | cron 06:00 UTC | S | ✅ |
| F-123 | Hebdo « près de chez vous » le lundi aux abonnés ayant un pays | cron | S | ✅ |
| F-124 | Rappel unique de profil incomplet le lundi | cron | S | ✅ |
| F-125 | Rappel d'événement la veille aux participants « J'y vais » | cron | S | ✅ |
| F-126 | Tableau de bord mensuel envoyé au HCBE le 1er (inscrits, actifs, pays, publications, messages, candidatures, abonnés, experts, régie) | cron | S | ✅ |
| F-127 | Rapport annonceurs mensuel par e-mail le 1er + export CSV 90 jours | cron · /api/admin/export/regie | S / E | ✅ |
| F-128 | Aperçu local de tous les e-mails (`scripts/apercu-mails.ts`) | script | E | ✅ |
| F-129 | Authentification du domaine chez Brevo (DKIM / DMARC, ligne SPF Hostinger) pour éviter le dossier spam | Brevo + DNS | — | ⚙️ à faire par le HCBE / Josué |

## J. Régie publicitaire

| N° | Fonctionnalité | Où | Accès | État |
|---|---|---|---|---|
| F-130 | 4 emplacements à format fixe : bandeau haut de rubrique, pavé latéral, pavé milieu d'accueil, bannière bas de page (formats mobiles dédiés) | site | V | ✅ |
| F-131 | Deux modèles de campagne : visuel fourni par l'annonceur ou carte « affiche » générée (photo d'ambiance, logo en badge, titre, accroche, bouton personnalisable) | /admin/regie/[id] | E | ✅ |
| F-132 | Carrousel par emplacement : toutes les campagnes actives défilent (6 s, pause au survol, balayage tactile, barre de progression) | site | V | ✅ |
| F-133 | Rotation pondérée : campagnes vendues d'abord, campagnes maison en repli ; un emplacement n'est jamais vide ; rien ne s'affiche s'il n'y a rien | S | S | ✅ |
| F-134 | Ciblage par rubrique et par pays, dates de début et de fin, poids | /admin/regie/[id] | E | ✅ |
| F-135 | Statistiques : affichages réels (balise de vue) et clics (redirection comptée) par jour, 30 jours sur le tableau de bord | /admin/regie · /api/pub/vue · /api/pub/clic | E | ✅ |
| F-136 | Cycle : brouillon, à valider, en diffusion, refusé, archivé ; Diffuser / Arrêter / Refuser ; journal d'audit | /admin/regie | E | ✅ |
| F-137 | 16 campagnes maison (4 partenaires × 4 emplacements) créées par script, alimentent aussi « Nos partenaires » | `pnpm pub:maison` | E | ✅ |
| F-138 | Rôle « Régie » : accès au seul menu Régie, à attribuer à la personne du HCBE | /admin/parametres | A | ✅ (personne à nommer) |
| F-139 | Mention « Publicité » accessible (aria-label, rel=sponsored) sur chaque encart | site | V | ✅ |
| F-140 | Libre-service annonceur (dépôt de campagne par les membres) | — | — | ✖ construit puis retiré le 27/10 : la publicité reste au HCBE |
| F-141 | Devis et paiement en ligne des campagnes (FedaPay), encart publicitaire dans la newsletter | — | — | ⏸️ non engagé |

## K. Sécurité, données et exploitation

| N° | Fonctionnalité | Où | Accès | État |
|---|---|---|---|---|
| F-142 | En-têtes de sécurité (nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy) et politique CSP stricte en production | S | S | ✅ |
| F-143 | Aucune adresse e-mail jamais affichée : tout contact passe par la messagerie relais | site | S | ✅ |
| F-144 | Sauvegarde quotidienne de toute la base (03:00 UTC) dans un coffre privé Vercel Blob, 30 dernières conservées | /api/cron/backup | S | ✅ |
| F-145 | Restauration complète d'une sauvegarde (`pnpm db:restore --latest` ou fichier), testée | script | E | ✅ |
| F-146 | Journal d'audit de toutes les actions sensibles | /admin/journal | E | ✅ |
| F-147 | Comptes suspendus bloqués y compris par lien magique ; suppression de compte complète ; export RGPD | — | S | ✅ |
| F-148 | Secrets hors du code (variables Vercel), détection de secrets Gitleaks sur le dépôt public | GitHub Actions | S | ✅ |
| F-149 | Contrôle qualité à chaque déploiement : lint + types + build, un échec bloque la mise en ligne (Vercel = CI) | Vercel | S | ✅ |
| F-150 | Géocodage des villes (Nominatim) à l'enregistrement du profil et à la publication ; rattrapage par script (`pnpm geocode`, `--pays`) | S | S | ✅ |
| F-151 | Reprise de l'ancien site WordPress : 23 lieux de mémoire, 2 itinéraires, charte de la communauté (`pnpm import:wordpress`) | script | E | ✅ |
| F-152 | Import des 10 besoins d'entreprises du SIAL Paris 2026 en demandes d'entraide (`pnpm import:sial`, `pnpm sial:statut`) | script | E | ✅ |
| F-153 | Outils d'exploitation : `db:etat` (état de la base), `db:backup` local, `search:reindex`, `db:seed` (démo) | scripts | E | ✅ |
| F-154 | Hébergement : Vercel (équipe bdmsite, région Paris), base Neon Postgres, coffres Blob privé et public, domaine beninois-du-monde.com (Hostinger → Vercel, HTTPS, www redirigé) | — | — | ✅ |
| F-155 | Documentation vivante : ETAT-PROJET.md (mémoire du projet), ce référentiel, Notion (décisions, vérification, pages à remplir) | dépôt · Notion | E | ✅ |

## L. En attente de décision ou non engagé

| N° | Fonctionnalité | Décideur | État |
|---|---|---|---|
| F-156 | Adhésion payante au HCBE : cotisation obligatoire ou optionnelle, montant, paiement FedaPay, page « Mon adhésion » | HCBE | ⏸️ |
| F-157 | Espace membre et back-office en anglais (seules les pages d'entrée et Roots sont traduites) | HCBE | ⏸️ chantier à part |
| F-158 | Recherche Meilisearch hébergée (tolérance aux fautes), si le volume le justifie | Josué | ⏸️ repli Postgres en place |
| F-159 | Suppression des 6 comptes de démonstration et de l'ancien projet Vercel de secours | Josué | ⚙️ avant l'ouverture |
| F-160 | Réouverture du site (fin du mode maintenance) après Brevo, réglages de sécurité et contenus officiels | HCBE / Josué | ⚙️ |

---

**Total : 160 fonctionnalités numérotées** — 139 en ligne (✅), 16 en ligne qui attendent un réglage ou une saisie (⚙️), 4 en attente de décision (⏸️), 1 retirée sur décision (✖).

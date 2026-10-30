import { Resend } from "resend";
import { SITE_URL } from "./site-url";

/* E-mails transactionnels. Fournisseur choisi par la clé présente :
   BREVO_API_KEY (gratuit, envoie sans domaine) > RESEND_API_KEY > console (dev).
   Sans clé, le message est affiché dans la console du serveur au lieu d'être envoyé.

   Tous les messages passent par le même gabarit (`layout`) : bande tricolore,
   fresque de la diaspora, titre Fraunces (Georgia en repli), bouton vert à angles
   droits, pied « Partenaire officiel du HCBE ». Texte brut fourni en parallèle. */

const FROM = process.env.EMAIL_FROM ?? "Béninois du Monde <no-reply@localhost>";

function parseFrom(from: string) {
  const m = from.match(/^(.*?)\s*<([^>]+)>$/);
  return m ? { name: m[1].trim(), email: m[2] } : { name: "Béninois du Monde", email: from };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/* ---------- Gabarit ---------- */

type Mail = {
  /** Texte affiché par les messageries sous l'objet, avant ouverture. */
  preheader: string;
  /** Petite surligne au-dessus du titre (« Connexion », « Bienvenue »…). */
  eyebrow: string;
  title: string;
  /** Paragraphes HTML déjà échappés (une entrée = un <p>). */
  paragraphs: string[];
  cta?: { label: string; url: string };
  /** Bloc mis en avant sous le bouton (citation, liste…), HTML déjà échappé. */
  panel?: string;
  /** Petite ligne grise en bas du corps (validité, « ignorez ce message »…). */
  footnote?: string;
  /** Afficher le bloc mis en avant avant le bouton (message reçu, liste d'alertes). */
  panelFirst?: boolean;
};

const GREEN = "#008751";
const INK = "#1b1f1d";
const INK_2 = "#5b625e";
const LINE = "#e6e9e7";

export function layout(m: Mail) {
  const p = m.paragraphs.map((h) => `<p style="margin:0 0 16px;font:17px/1.6 'Source Sans 3',Helvetica,Arial,sans-serif;color:${INK}">${h}</p>`).join("");
  const cta = m.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="background:${GREEN}">
         <a href="${m.cta.url}" style="display:inline-block;padding:15px 28px;font:700 16px/1 'Source Sans 3',Helvetica,Arial,sans-serif;color:#ffffff;text-decoration:none;letter-spacing:.2px">${esc(m.cta.label)} →</a>
       </td></tr></table>
       <p style="margin:-12px 0 24px;font:13px/1.5 Helvetica,Arial,sans-serif;color:${INK_2}">Le bouton ne s'ouvre pas ? Copiez ce lien : <span style="color:${GREEN};word-break:break-all">${esc(m.cta.url)}</span></p>`
    : "";
  const panel = m.panel ? `<div style="margin:0 0 24px;padding:18px 20px;background:#f4f8f5;border-left:4px solid ${GREEN}">${m.panel}</div>` : "";
  const note = m.footnote ? `<p style="margin:0;font:14px/1.5 Helvetica,Arial,sans-serif;color:${INK_2}">${m.footnote}</p>` : "";

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${esc(m.title)}</title>
<style>@media (max-width:620px){.wrap{width:100%!important}.pad{padding:24px 20px!important}.h1{font-size:28px!important}}</style>
</head>
<body style="margin:0;padding:0;background:#f1f3f2">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(m.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f2"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff">
  <tr><td style="font-size:0;line-height:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="33%" style="height:6px;background:${GREEN}"></td><td width="34%" style="height:6px;background:#fcd116"></td><td width="33%" style="height:6px;background:#e8112d"></td></tr></table></td></tr>
  <tr><td class="pad" style="padding:22px 36px 0">
    <a href="${SITE_URL}" style="text-decoration:none"><span style="font:700 22px/1 Fraunces,Georgia,'Times New Roman',serif;color:${INK}">Béninois <span style="color:${GREEN}">du Monde</span></span></a>
    <span style="float:right;font:600 12px/22px Helvetica,Arial,sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:${INK_2}">${esc(m.eyebrow)}</span>
  </td></tr>
  <tr><td style="padding:18px 0 0"><img src="${SITE_URL}/images/mail-entete.jpg" width="600" height="200" alt="" style="display:block;width:100%;height:auto"></td></tr>
  <tr><td class="pad" style="padding:30px 36px 8px">
    <h1 class="h1" style="margin:0 0 18px;font:700 32px/1.15 Fraunces,Georgia,'Times New Roman',serif;color:${INK};letter-spacing:-.3px">${esc(m.title)}</h1>
    ${p}${m.panelFirst ? panel + cta : cta + panel}${note}
  </td></tr>
  <tr><td class="pad" style="padding:24px 36px 28px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${LINE};padding-top:18px">
      <p style="margin:0 0 6px;font:600 12px/1.4 Helvetica,Arial,sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:${INK_2}">Partenaire officiel du HCBE</p>
      <p style="margin:0 0 10px;font:14px/1.5 Helvetica,Arial,sans-serif;color:${INK_2}">Béninois du Monde, le média et le réseau de la diaspora béninoise. Haut Conseil des Béninois de l'Extérieur.</p>
      <p style="margin:0;font:13px/1.6 Helvetica,Arial,sans-serif;color:${INK_2}">
        <a href="${SITE_URL}" style="color:${GREEN};text-decoration:none">beninois-du-monde</a> &nbsp;·&nbsp;
        <a href="${SITE_URL}/compte/alertes" style="color:${GREEN};text-decoration:none">Mes alertes</a> &nbsp;·&nbsp;
        <a href="${SITE_URL}/contact" style="color:${GREEN};text-decoration:none">Nous écrire</a> &nbsp;·&nbsp;
        <a href="${SITE_URL}/legal/confidentialite" style="color:${GREEN};text-decoration:none">Confidentialité</a>
      </p>
    </td></tr></table>
  </td></tr>
</table>
<p style="margin:16px 0 0;font:12px/1.5 Helvetica,Arial,sans-serif;color:#8a918d">Vous recevez ce message parce qu'une action a été demandée avec cette adresse sur Béninois du Monde.</p>
</td></tr></table>
</body></html>`;
}

async function send(to: string, subject: string, text: string, html: string) {
  if (process.env.BREVO_API_KEY) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sender: parseFrom(FROM), to: [{ email: to }], subject, textContent: text, htmlContent: html }),
    });
    if (!res.ok) throw new Error(`Envoi e-mail impossible (Brevo ${res.status}) : ${await res.text()}`);
    return;
  }
  if (process.env.RESEND_API_KEY) {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM, to, subject, text, html });
    if (error) throw new Error(`Envoi e-mail impossible (Resend) : ${error.message}`);
    return;
  }
  console.log(`\n[mail → ${to}] ${subject}\n${text}\n`);
}

const SIGN = "\n\n— Béninois du Monde, partenaire officiel du HCBE\n" + SITE_URL;

/* ---------- Messages ---------- */

export function sendMagicLink(to: string, url: string) {
  return send(
    to,
    "Votre porte d'entrée, valable 24 h",
    `Bonjour,\n\nVous avez demandé à vous connecter à Béninois du Monde. Ouvrez ce lien pour entrer (valable 24 h) :\n${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ne faites rien : personne ne peut entrer sans ce lien.${SIGN}`,
    layout({
      preheader: "Un clic et vous êtes connecté. Lien valable 24 heures.",
      eyebrow: "Connexion",
      title: "On vous ouvre la porte.",
      paragraphs: ["Vous avez demandé à vous connecter à Béninois du Monde. Pas de mot de passe à retenir : ce lien suffit."],
      cta: { label: "Me connecter", url },
      footnote: "Lien valable 24 heures et utilisable une seule fois. Si vous n'êtes pas à l'origine de cette demande, ne faites rien : personne ne peut entrer sans ce lien.",
    }),
  );
}

export function sendEmailConfirmation(to: string, url: string) {
  return send(
    to,
    "Bienvenue ! Une dernière étape",
    `Bienvenue sur Béninois du Monde.\n\nConfirmez votre adresse pour activer votre compte :\n${url}\n\nEnsuite : complétez votre profil, choisissez ce qui est visible, publiez vos annonces et suivez les mots-clés qui vous intéressent.${SIGN}`,
    layout({
      preheader: "Confirmez votre adresse et votre espace s'ouvre.",
      eyebrow: "Bienvenue",
      title: "Bonne arrivée parmi les vôtres.",
      paragraphs: [
        "Votre compte est créé. Il ne manque qu'une confirmation pour l'activer et rejoindre le réseau de la diaspora béninoise.",
      ],
      cta: { label: "Activer mon compte", url },
      panel: `<p style="margin:0 0 8px;font:600 15px/1.4 Helvetica,Arial,sans-serif;color:${INK}">Ensuite, en trois minutes :</p>
        <p style="margin:0;font:15px/1.7 Helvetica,Arial,sans-serif;color:${INK}">1. Complétez votre profil et choisissez ce qui est visible.<br>2. Suivez les mots-clés qui vous concernent (ville, métier, passion).<br>3. Publiez votre première annonce, votre événement ou votre bonne adresse.</p>`,
      footnote: "Vous n'avez pas créé de compte ? Ignorez ce message, rien ne sera activé.",
    }),
  );
}

export function sendInvitation(to: string, displayName: string, url: string) {
  const prenom = displayName.trim();
  return send(
    to,
    prenom ? `${prenom}, votre espace vous attend` : "Votre espace vous attend",
    `Bonjour${prenom ? ` ${prenom}` : ""},\n\nLe HCBE a ouvert votre espace sur Béninois du Monde, le média et le réseau de la diaspora béninoise. Activez-le ici :\n${url}\n\nVous pourrez ensuite compléter votre profil, choisir ce qui est visible, publier et suivre ce qui se passe près de chez vous.${SIGN}`,
    layout({
      preheader: "Le HCBE vous a réservé une place sur Béninois du Monde.",
      eyebrow: "Invitation",
      title: prenom ? `${prenom}, votre place est prête.` : "Votre place est prête.",
      paragraphs: [
        "Le <strong>Haut Conseil des Béninois de l'Extérieur</strong> vous a ouvert un espace sur Béninois du Monde : le média et le réseau de la diaspora béninoise, de Cotonou à Montréal, de Paris à Lagos.",
        "Un clic pour l'activer. Vous décidez ensuite de tout : ce qui est visible, ce que vous publiez, les sujets que vous suivez.",
      ],
      cta: { label: "Activer mon espace", url },
      panel: `<p style="margin:0;font:15px/1.7 Helvetica,Arial,sans-serif;color:${INK}"><strong>Ce qui vous attend :</strong> l'annuaire des Béninois près de chez vous, les offres d'emploi et les annonces de la communauté, l'agenda des événements, les bons plans partenaires et les alertes par mots-clés.</p>`,
      footnote: "Ce lien vous est personnel. Si vous ne souhaitez pas de compte, ignorez simplement ce message : rien ne sera créé sans vous.",
    }),
  );
}

/* Formulaire de contact : le message part vers l'adresse de contact du HCBE
   (CONTACT_EMAIL, sinon EMAIL_FROM). L'expéditeur n'est jamais affiché sur le site. */
export function sendContactMessage(from: { name: string; email: string }, subject: string, message: string) {
  const to = process.env.CONTACT_EMAIL ?? parseFrom(FROM).email;
  return send(
    to,
    `[Contact] ${subject}`,
    `Nouveau message reçu via le formulaire de contact.\n\nDe : ${from.name} <${from.email}>\nSujet : ${subject}\n\n${message}${SIGN}`,
    layout({
      preheader: `${from.name} vous écrit : ${subject}`,
      eyebrow: "Formulaire de contact",
      title: subject,
      paragraphs: [`<strong>${esc(from.name)}</strong> &lt;${esc(from.email)}&gt; a écrit via le formulaire de contact du site.`],
      panel: `<p style="margin:0;font:16px/1.65 Helvetica,Arial,sans-serif;color:${INK};white-space:pre-line">${esc(message)}</p>`,
      footnote: "Répondez directement à cette adresse depuis votre messagerie.",
    }),
  );
}

/* Messagerie relais : le destinataire reçoit le message et un lien pour répondre
   sur le site. L'adresse de l'expéditeur n'est jamais transmise. */
export function sendRelayNotification(to: string, fromName: string, subject: string, body: string, link: string) {
  return send(
    to,
    `${fromName} vous a écrit : ${subject}`,
    `${fromName} vous a écrit via Béninois du Monde :\n\n${body}\n\nRépondre sur le site (votre adresse reste privée) : ${link}${SIGN}`,
    layout({
      preheader: `${fromName} : ${body.slice(0, 90)}`,
      eyebrow: "Message reçu",
      title: `${fromName} vous a écrit.`,
      paragraphs: [`Objet : <strong>${esc(subject)}</strong>`],
      panel: `<p style="margin:0;font:16px/1.65 Helvetica,Arial,sans-serif;color:${INK};white-space:pre-line">${esc(body)}</p>`,
      cta: { label: "Répondre sur le site", url: link },
      panelFirst: true,
      footnote: "Votre adresse e-mail n'est jamais communiquée : toute la conversation passe par le site.",
    }),
  );
}

/* Alertes par mots-clés : la sélection du jour, un e-mail par membre. */
export function sendAlertDigest(to: string, items: { title: string; href: string; label: string }[], manageLink: string) {
  const n = items.length;
  const list = items
    .map(
      (i) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${LINE}">
        <span style="display:inline-block;margin-bottom:4px;padding:2px 8px;background:#fdf4cd;font:700 11px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;color:${INK}">${esc(i.label)}</span><br>
        <a href="${i.href}" style="font:600 17px/1.4 'Source Sans 3',Helvetica,Arial,sans-serif;color:${INK};text-decoration:none">${esc(i.title)}</a></td></tr>`,
    )
    .join("");
  return send(
    to,
    n > 1 ? `${n} nouveautés qui vous concernent` : "Une nouveauté qui vous concerne",
    `Voici ce qui vient de paraître sur vos mots-clés :\n\n${items.map((i) => `• [${i.label}] ${i.title}\n  ${i.href}`).join("\n")}\n\nGérer mes alertes : ${manageLink}${SIGN}`,
    layout({
      preheader: items[0] ? `${items[0].label} : ${items[0].title}` : "Vos mots-clés ont parlé.",
      eyebrow: "Vos alertes",
      title: n > 1 ? `${n} nouveautés sur vos mots-clés.` : "Une nouveauté sur vos mots-clés.",
      paragraphs: ["Vous suivez ces sujets, voici ce qui vient de paraître. Un clic pour lire, postuler ou réserver."],
      panel: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${list}</table>`,
      cta: { label: "Gérer mes alertes", url: manageLink },
      panelFirst: true,
      footnote: "Vous recevez cet e-mail parce que vous avez créé une alerte. Modifiez vos mots-clés ou supprimez l'alerte à tout moment depuis votre espace.",
    }),
  );
}

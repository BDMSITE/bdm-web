import { Resend } from "resend";

/* E-mails transactionnels. Fournisseur choisi par la clé présente :
   BREVO_API_KEY (gratuit, envoie sans domaine) > RESEND_API_KEY > console (dev).
   Sans clé, le message est affiché dans la console du serveur au lieu d'être envoyé. */

const FROM = process.env.EMAIL_FROM ?? "Béninois du Monde <no-reply@localhost>";

function parseFrom(from: string) {
  const m = from.match(/^(.*?)\s*<([^>]+)>$/);
  return m ? { name: m[1].trim(), email: m[2] } : { name: "Béninois du Monde", email: from };
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

export function sendMagicLink(to: string, url: string) {
  return send(
    to,
    "Votre lien de connexion — Béninois du Monde",
    `Connectez-vous en ouvrant ce lien (valable 24 h) : ${url}`,
    `<p>Bonjour,</p><p>Cliquez pour vous connecter à <strong>Béninois du Monde</strong> (lien valable 24 h) :</p><p><a href="${url}">${url}</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`,
  );
}

export function sendEmailConfirmation(to: string, url: string) {
  return send(
    to,
    "Confirmez votre adresse — Béninois du Monde",
    `Bienvenue ! Confirmez votre adresse en ouvrant ce lien : ${url}`,
    `<p>Bienvenue sur <strong>Béninois du Monde</strong> !</p><p>Confirmez votre adresse e-mail pour activer votre compte :</p><p><a href="${url}">${url}</a></p>`,
  );
}

export function sendInvitation(to: string, displayName: string, url: string) {
  return send(
    to,
    "Votre espace membre vous attend — Béninois du Monde",
    `Bonjour ${displayName},\n\nLe HCBE a ouvert votre espace sur Béninois du Monde, le réseau de la diaspora béninoise. Activez-le en ouvrant ce lien : ${url}\n\nVous pourrez ensuite compléter votre profil, choisir ce qui est visible et publier.`,
    `<p>Bonjour ${displayName},</p><p>Le HCBE a ouvert votre espace sur <strong>Béninois du Monde</strong>, le réseau de la diaspora béninoise.</p><p><a href="${url}">Activer mon espace</a></p><p>Vous pourrez ensuite compléter votre profil, choisir ce qui est visible et publier.</p>`,
  );
}

/* Formulaire de contact : le message part vers l'adresse de contact du HCBE
   (CONTACT_EMAIL, sinon EMAIL_FROM). L'expéditeur n'est jamais affiché sur le site. */
export function sendContactMessage(from: { name: string; email: string }, subject: string, message: string) {
  const to = process.env.CONTACT_EMAIL ?? parseFrom(FROM).email;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
  return send(
    to,
    `[Contact] ${subject}`,
    `Message reçu via le formulaire de contact de Béninois du Monde.\n\nDe : ${from.name} <${from.email}>\nSujet : ${subject}\n\n${message}`,
    `<p>Message reçu via le formulaire de contact de <strong>Béninois du Monde</strong>.</p><p><strong>De :</strong> ${esc(from.name)} &lt;${esc(from.email)}&gt;<br><strong>Sujet :</strong> ${esc(subject)}</p><p style="white-space:pre-line">${esc(message)}</p>`,
  );
}

/* Messagerie relais : le destinataire reçoit le message et un lien pour répondre
   sur le site. L'adresse de l'expéditeur n'est jamais transmise. */
export function sendRelayNotification(to: string, fromName: string, subject: string, body: string, link: string) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
  return send(
    to,
    `${subject} — Béninois du Monde`,
    `${fromName} vous a écrit via Béninois du Monde :\n\n${body}\n\nRépondre (sans dévoiler votre adresse) : ${link}`,
    `<p><strong>${esc(fromName)}</strong> vous a écrit via <strong>Béninois du Monde</strong> :</p><blockquote style="border-left:3px solid #008751;padding-left:12px;white-space:pre-line">${esc(body)}</blockquote><p><a href="${link}">Répondre sur le site</a> — votre adresse e-mail n'est jamais communiquée.</p>`,
  );
}

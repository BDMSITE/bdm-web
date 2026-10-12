import { Resend } from "resend";

/* E-mails transactionnels. Sans RESEND_API_KEY (dev local), le message est
   affiché dans la console du serveur au lieu d'être envoyé. */

const FROM = process.env.EMAIL_FROM ?? "Béninois du Monde <no-reply@localhost>";

async function send(to: string, subject: string, text: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`\n[mail → ${to}] ${subject}\n${text}\n`);
    return;
  }
  const { error } = await new Resend(apiKey).emails.send({ from: FROM, to, subject, text, html });
  if (error) throw new Error(`Envoi e-mail impossible : ${error.message}`);
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

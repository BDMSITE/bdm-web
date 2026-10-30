/* Aperçu des gabarits d'e-mails : écrit un fichier HTML par message dans le dossier donné.
   pnpm tsx scripts/apercu-mails.ts /chemin/vers/dossier
   Aucun envoi : BREVO_API_KEY et RESEND_API_KEY sont vidées avant l'import. */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { layout } from "../src/lib/mail";

delete process.env.BREVO_API_KEY;
delete process.env.RESEND_API_KEY;

const out = process.argv[2] ?? "apercu-mails";
mkdirSync(out, { recursive: true });

const base = "https://bdm-web-psi.vercel.app";

const pages: Record<string, string> = {
  connexion: layout({
    preheader: "Un clic et vous êtes connecté. Lien valable 24 heures.",
    eyebrow: "Connexion",
    title: "On vous ouvre la porte.",
    paragraphs: ["Vous avez demandé à vous connecter à Béninois du Monde. Pas de mot de passe à retenir : ce lien suffit."],
    cta: { label: "Me connecter", url: `${base}/api/auth/callback/resend?token=exemple` },
    footnote: "Lien valable 24 heures et utilisable une seule fois. Si vous n'êtes pas à l'origine de cette demande, ne faites rien.",
  }),
  invitation: layout({
    preheader: "Le HCBE vous a réservé une place sur Béninois du Monde.",
    eyebrow: "Invitation",
    title: "Aïcha, votre place est prête.",
    paragraphs: [
      "Le <strong>Haut Conseil des Béninois de l'Extérieur</strong> vous a ouvert un espace sur Béninois du Monde : le média et le réseau de la diaspora béninoise, de Cotonou à Montréal, de Paris à Lagos.",
      "Un clic pour l'activer. Vous décidez ensuite de tout : ce qui est visible, ce que vous publiez, les sujets que vous suivez.",
    ],
    cta: { label: "Activer mon espace", url: `${base}/connexion` },
    panel: `<p style="margin:0;font:15px/1.7 Helvetica,Arial,sans-serif;color:#1b1f1d"><strong>Ce qui vous attend :</strong> l'annuaire des Béninois près de chez vous, les offres d'emploi et les annonces de la communauté, l'agenda des événements, les bons plans partenaires et les alertes par mots-clés.</p>`,
    footnote: "Ce lien vous est personnel. Si vous ne souhaitez pas de compte, ignorez simplement ce message.",
  }),
  alertes: layout({
    preheader: "Emploi : Comptable bilingue, Montréal",
    eyebrow: "Vos alertes",
    title: "3 nouveautés sur vos mots-clés.",
    paragraphs: ["Vous suivez ces sujets, voici ce qui vient de paraître. Un clic pour lire, postuler ou réserver."],
    panel: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:10px 0;border-bottom:1px solid #e6e9e7"><span style="display:inline-block;margin-bottom:4px;padding:2px 8px;background:#fdf4cd;font:700 11px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;color:#1b1f1d">Emploi</span><br><a href="${base}/emploi" style="font:600 17px/1.4 Helvetica,Arial,sans-serif;color:#1b1f1d;text-decoration:none">Comptable bilingue, cabinet à Montréal</a></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #e6e9e7"><span style="display:inline-block;margin-bottom:4px;padding:2px 8px;background:#fdf4cd;font:700 11px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;color:#1b1f1d">Agenda</span><br><a href="${base}/agenda" style="font:600 17px/1.4 Helvetica,Arial,sans-serif;color:#1b1f1d;text-decoration:none">Soirée des indépendances, Paris 19e</a></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #e6e9e7"><span style="display:inline-block;margin-bottom:4px;padding:2px 8px;background:#fdf4cd;font:700 11px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;color:#1b1f1d">Bon plan</span><br><a href="${base}/bons-plans" style="font:600 17px/1.4 Helvetica,Arial,sans-serif;color:#1b1f1d;text-decoration:none">-15 % sur le studio Wanilo pour les membres</a></td></tr>
    </table>`,
    cta: { label: "Gérer mes alertes", url: `${base}/compte/alertes` },
    panelFirst: true,
    footnote: "Vous recevez cet e-mail parce que vous avez créé une alerte. Modifiez vos mots-clés ou supprimez l'alerte à tout moment.",
  }),
  newsletter: layout({
    preheader: "Comptable bilingue, cabinet à Montréal",
    eyebrow: "La lettre",
    title: "La lettre de novembre : 12 offres, 5 événements",
    paragraphs: ["Ce mois-ci, la diaspora recrute à Montréal et à Paris, Cotonou prépare les fêtes et nos partenaires ouvrent leurs portes aux membres."],
    panel: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:14px 0;border-bottom:1px solid #e6e9e7"><span style="display:inline-block;margin-bottom:6px;padding:2px 8px;background:#fdf4cd;font:700 11px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;color:#1b1f1d">Offre d'emploi</span><span style="margin-left:8px;font:13px/1.4 Helvetica,Arial,sans-serif;color:#5b625e">Montréal, Canada</span><br><a href="${base}/emploi" style="font:700 19px/1.35 Helvetica,Arial,sans-serif;color:#1b1f1d;text-decoration:none">Comptable bilingue, cabinet à Montréal</a><p style="margin:6px 0 0;font:15px/1.5 Helvetica,Arial,sans-serif;color:#5b625e">CDI, télétravail partiel, cabinet fondé par un Béninois de Montréal.</p></td></tr>
      <tr><td style="padding:14px 0;border-bottom:1px solid #e6e9e7"><span style="display:inline-block;margin-bottom:6px;padding:2px 8px;background:#fdf4cd;font:700 11px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;color:#1b1f1d">Événement</span><span style="margin-left:8px;font:13px/1.4 Helvetica,Arial,sans-serif;color:#5b625e">Paris, France</span><br><a href="${base}/agenda" style="font:700 19px/1.35 Helvetica,Arial,sans-serif;color:#1b1f1d;text-decoration:none">Soirée des indépendances, Paris 19e</a></td></tr>
      <tr><td style="padding:14px 0;border-bottom:1px solid #e6e9e7"><span style="display:inline-block;margin-bottom:6px;padding:2px 8px;background:#fdf4cd;font:700 11px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;color:#1b1f1d">Bon plan</span><br><a href="${base}/bons-plans" style="font:700 19px/1.35 Helvetica,Arial,sans-serif;color:#1b1f1d;text-decoration:none">-15 % sur le studio Wanilo pour les membres</a></td></tr>
    </table>`,
    panelFirst: true,
    cta: { label: "Tout voir sur le site", url: base },
    footnote: `Vous recevez cette lettre parce que vous y êtes abonné. <a href="${base}/newsletter" style="color:#5b625e">Se désinscrire en un clic</a>.`,
  }),
};

for (const [name, html] of Object.entries(pages)) writeFileSync(join(out, `${name}.html`), html);
console.log(`${Object.keys(pages).length} aperçus écrits dans ${out}`);

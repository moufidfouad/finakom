import nodemailer from 'nodemailer';
import { env } from './env';

export const isEmailConfigured = !!(env.SMTP_USER && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN);

/**
 * Transporteur Gmail en OAuth2 (PAS de mot de passe d'application) : le Client
 * ID/Secret viennent d'une app Google Cloud Console, le jeton de rafraîchissement
 * est obtenu une fois via OAuth Playground (voir .env.example pour la procédure).
 * Nodemailer utilise ce refresh token pour obtenir automatiquement un nouveau
 * jeton d'accès à chaque envoi — rien à renouveler manuellement.
 *
 * Créé une seule fois (singleton) — null si l'email n'est pas configuré, auquel
 * cas sendMail() ci-dessous no-op avec un avertissement plutôt que de faire
 * planter le serveur.
 */
export const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: env.SMTP_USER,
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        refreshToken: env.GOOGLE_REFRESH_TOKEN,
      },
    })
  : null;

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Permet au destinataire de répondre directement à un tiers plutôt qu'à
   * l'adresse d'envoi FINAKOM — utilisé par exemple pour transmettre un
   * message d'un recruteur à un candidat sans jamais exposer l'email réel
   * de ce dernier au client. */
  replyTo?: string;
}

/**
 * Envoie un email si l'OAuth2 Gmail est configuré ; sinon journalise un
 * avertissement et ne fait rien. Les erreurs d'envoi sont capturées ici
 * (jamais propagées) : un email qui échoue à partir ne doit jamais faire
 * échouer l'action métier qui l'a déclenché (inscription, contact...) —
 * seulement être visible dans les logs.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  if (!transporter) {
    console.warn(`⚠️  Email non envoyé (OAuth2 Gmail non configuré) — destinataire : ${message.to}, sujet : "${message.subject}"`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"FINAKOM" <${env.SMTP_USER}>`,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  } catch (err) {
    console.error(`❌ Échec de l'envoi d'email à ${message.to} :`, err);
  }
}

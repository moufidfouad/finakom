import { env } from "@/config/env";
import { sendMail } from "@/config/mailer";

const BRAND_COLOR = "#1e2a4a";

/** Le formulaire de contact est public (non authentifié) : son contenu ne doit
 * jamais être injecté tel quel dans le HTML de l'email envoyé (injection HTML
 * dans le client mail du destinataire, usurpation de mise en forme...). */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapHtml(
  title: string,
  bodyHtml: string,
  ctaLabel?: string,
  ctaUrl?: string,
): string {
  const button = ctaUrl
    ? `<div style="text-align:center;margin:28px 0;">
         <a href="${ctaUrl}" style="background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-family:sans-serif;font-size:14px;display:inline-block;">${ctaLabel}</a>
       </div>
       <p style="font-family:sans-serif;font-size:12px;color:#888;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien : ${ctaUrl}</p>`
    : "";

  return `
    <div style="max-width:520px;margin:0 auto;padding:32px 24px;font-family:sans-serif;color:#1a1a1a;">
      <h1 style="font-size:18px;color:${BRAND_COLOR};margin:0 0 20px;">${title}</h1>
      <div style="font-size:14px;line-height:1.6;">${bodyHtml}</div>
      ${button}
      <p style="font-family:sans-serif;font-size:12px;color:#999;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">FINAKOM — plateforme de gestion pour entreprises OHADA</p>
    </div>`;
}

export async function sendVerificationEmail(
  to: string,
  fullName: string | null,
  rawToken: string,
) {
  const url = `${env.FRONTEND_URL}/verifier-email?token=${rawToken}`;
  const greeting = fullName ? `Bonjour ${fullName},` : "Bonjour,";
  await sendMail({
    to,
    subject: "Vérifiez votre adresse email — FINAKOM",
    html: wrapHtml(
      "Vérifiez votre adresse email",
      `<p>${greeting}</p><p>Merci de votre inscription sur FINAKOM. Confirmez votre adresse email pour activer toutes les fonctionnalités de votre compte.</p><p>Ce lien expire dans 24 heures.</p>`,
      "Vérifier mon email",
      url,
    ),
    text: `${greeting}\n\nConfirmez votre adresse email en ouvrant ce lien (valable 24h) :\n${url}`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  fullName: string | null,
  rawToken: string,
) {
  const url = `${env.FRONTEND_URL}/reinitialiser-mot-de-passe?token=${rawToken}`;
  const greeting = fullName ? `Bonjour ${fullName},` : "Bonjour,";
  await sendMail({
    to,
    subject: "Réinitialisation de votre mot de passe — FINAKOM",
    html: wrapHtml(
      "Réinitialisation de mot de passe",
      `<p>${greeting}</p><p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte FINAKOM. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre mot de passe restera inchangé.</p><p>Ce lien expire dans 1 heure.</p>`,
      "Réinitialiser mon mot de passe",
      url,
    ),
    text: `${greeting}\n\nRéinitialisez votre mot de passe en ouvrant ce lien (valable 1h) :\n${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
  });
}

export interface ContactNotificationInput {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactNotification(input: ContactNotificationInput) {
  const destination = env.CONTACT_EMAIL ?? env.SMTP_USER;
  if (!destination) {
    console.warn(
      "⚠️  Aucune adresse de destination pour le formulaire de contact (CONTACT_EMAIL / SMTP_USER absents).",
    );
    return;
  }
  // Le sujet devient un en-tête d'email (nodemailer neutralise déjà l'injection
  // d'en-têtes, mais on retire aussi les retours à la ligne par prudence — saisie non authentifiée).
  const safeSubject = input.subject.replace(/[\r\n]+/g, " ").slice(0, 200);
  await sendMail({
    to: destination,
    subject: `[Contact FINAKOM] ${safeSubject}`,
    html: wrapHtml(
      "Nouveau message de contact",
      `<p><strong>De :</strong> ${escapeHtml(input.fullName)} (${escapeHtml(input.email)})</p><p><strong>Sujet :</strong> ${escapeHtml(input.subject)}</p><p style="white-space:pre-wrap;">${escapeHtml(input.message)}</p>`,
    ),
    text: `De : ${input.fullName} (${input.email})\nSujet : ${input.subject}\n\n${input.message}`,
  });
}

export interface AlertForEmail {
  category: string;
  severity: "CRITIQUE" | "ALERTE";
  message: string;
}

/**
 * Synthèse quotidienne des alertes d'une entreprise — UN SEUL email regroupant
 * toutes les alertes détectées (trésorerie, factures impayées, stock,
 * contrats), plutôt qu'un email par alerte : un dirigeant qui a dix alertes le
 * même jour doit recevoir un email lisible, pas dix notifications séparées.
 * Les alertes critiques sont listées avant les alertes simples.
 */
export async function sendAlertDigestEmail(
  to: string,
  fullName: string | null,
  companyName: string,
  alerts: AlertForEmail[],
) {
  if (alerts.length === 0) return;
  const greeting = fullName ? `Bonjour ${fullName},` : "Bonjour,";
  const sorted = [...alerts].sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "CRITIQUE" ? -1 : 1,
  );
  const critiques = sorted.filter((a) => a.severity === "CRITIQUE");
  const listItems = sorted
    .map(
      (a) =>
        `<li style="margin-bottom:6px;"><strong style="color:${a.severity === "CRITIQUE" ? "#b91c1c" : "#b45309"};">[${a.severity}]</strong> ${escapeHtml(a.message)}</li>`,
    )
    .join("");

  const subjectPrefix = critiques.length > 0 ? "[URGENT] " : "";
  await sendMail({
    to,
    subject: `${subjectPrefix}${alerts.length} alerte(s) — ${companyName}`,
    html: wrapHtml(
      `Synthèse des alertes — ${escapeHtml(companyName)}`,
      `<p>${greeting}</p><p>Voici ${alerts.length} point(s) qui méritent votre attention aujourd'hui :</p><ul style="padding-left:18px;">${listItems}</ul>`,
    ),
    text: `${greeting}\n\nVoici ${alerts.length} point(s) qui méritent votre attention aujourd'hui :\n\n${sorted.map((a) => `[${a.severity}] ${a.message}`).join("\n")}`,
  });
}

/**
 * Variantes candidates de sendVerificationEmail / sendPasswordResetEmail —
 * réutilisent sendMail/wrapHtml (génériques), mais pointent vers les routes
 * de l'espace candidat (/candidat/...), jamais celles de l'espace entreprise :
 * un candidat qui cliquerait sur un lien /verifier-email atterrirait sur le
 * mauvais formulaire, appelant le mauvais endpoint backend.
 */
export async function sendCandidateVerificationEmail(
  to: string,
  fullName: string | null,
  rawToken: string,
) {
  const url = `${env.FRONTEND_URL}/candidat/verifier-email?token=${rawToken}`;
  const greeting = fullName ? `Bonjour ${fullName},` : "Bonjour,";
  await sendMail({
    to,
    subject: "Vérifiez votre adresse email — Espace candidat FINAKOM",
    html: wrapHtml(
      "Vérifiez votre adresse email",
      `<p>${greeting}</p><p>Merci de votre inscription sur l'espace candidat FINAKOM. Confirmez votre adresse email pour activer votre compte.</p><p>Ce lien expire dans 24 heures.</p>`,
      "Vérifier mon email",
      url,
    ),
    text: `${greeting}\n\nConfirmez votre adresse email en ouvrant ce lien (valable 24h) :\n${url}`,
  });
}

export async function sendCandidatePasswordResetEmail(
  to: string,
  fullName: string | null,
  rawToken: string,
) {
  const url = `${env.FRONTEND_URL}/candidat/reinitialiser-mot-de-passe?token=${rawToken}`;
  const greeting = fullName ? `Bonjour ${fullName},` : "Bonjour,";
  await sendMail({
    to,
    subject: "Réinitialisation de votre mot de passe — Espace candidat FINAKOM",
    html: wrapHtml(
      "Réinitialisation de mot de passe",
      `<p>${greeting}</p><p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte candidat FINAKOM. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre mot de passe restera inchangé.</p><p>Ce lien expire dans 1 heure.</p>`,
      "Réinitialiser mon mot de passe",
      url,
    ),
    text: `${greeting}\n\nRéinitialisez votre mot de passe en ouvrant ce lien (valable 1h) :\n${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
  });
}

/**
 * Relaie un message vers l'email RÉEL d'un candidat, sans jamais l'exposer
 * au visiteur qui l'a envoyé — c'est précisément le mécanisme qui permet à
 * l'annuaire public de CV de rester consultable sans exposer les coordonnées
 * en clair dans le HTML (protection contre le moissonnage automatisé).
 * L'adresse email du visiteur, elle, est volontairement visible dans le
 * corps du message : le candidat doit pouvoir répondre directement.
 */
export async function sendCandidateContactEmail(
  candidateEmail: string,
  candidateName: string,
  cvTitle: string,
  senderName: string,
  senderEmail: string,
  message: string,
) {
  await sendMail({
    to: candidateEmail,
    replyTo: senderEmail,
    subject: `Un recruteur vous contacte via FINAKOM — ${cvTitle}`,
    html: wrapHtml(
      "Un message vous a été envoyé via FINAKOM",
      `<p>Bonjour ${escapeHtml(candidateName)},</p><p><strong>${escapeHtml(senderName)}</strong> (${escapeHtml(senderEmail)}) vous a envoyé un message concernant votre CV « ${escapeHtml(cvTitle)} » publié sur FINAKOM :</p><p style="white-space:pre-wrap;">${escapeHtml(message)}</p><p>Vous pouvez répondre directement à cet email pour échanger avec cette personne.</p>`,
    ),
    text: `Bonjour ${candidateName},\n\n${senderName} (${senderEmail}) vous a envoyé un message concernant votre CV « ${cvTitle} » publié sur FINAKOM :\n\n${message}\n\nVous pouvez répondre directement à cet email pour échanger avec cette personne.`,
  });
}

export interface JobNotificationForEmail {
  notificationId: string;
  jobPostingTitle: string;
  companyName: string;
}

/**
 * Notifie un candidat des offres correspondant à son profil — appelée
 * immédiatement à la publication d'une offre (envoi instantané, décision
 * produit explicite), avec une liste d'un seul élément dans le cas courant ;
 * conserve le paramètre en tableau car elle sert aussi de filet de sécurité
 * pour regrouper d'éventuelles notifications en attente (voir
 * sendCandidateNotificationDigest côté service). Chaque lien pointe vers
 * l'endpoint de clic backend (pas directement vers l'offre) : il marque la
 * notification comme lue avant de rediriger, pour que l'état "lu" reste
 * synchronisé entre l'email et l'espace in-app.
 */
export async function sendCandidateJobNotificationDigest(
  to: string,
  fullName: string | null,
  notifications: JobNotificationForEmail[],
) {
  if (notifications.length === 0) return;
  const greeting = fullName ? `Bonjour ${fullName},` : "Bonjour,";
  const listItems = notifications
    .map((n) => {
      const url = `${env.BACKEND_URL}/${env.API_V1_URL}/candidate-notifications/${n.notificationId}/click`;
      return `<li style="margin-bottom:8px;"><a href="${url}" style="color:${BRAND_COLOR};text-decoration:none;font-weight:600;">${escapeHtml(n.jobPostingTitle)}</a> — ${escapeHtml(n.companyName)}</li>`;
    })
    .join("");

  await sendMail({
    to,
    subject: `${notifications.length} nouvelle(s) offre(s) correspondant à votre profil`,
    html: wrapHtml(
      "De nouvelles offres pourraient vous intéresser",
      `<p>${greeting}</p><p>Voici ${notifications.length} offre(s) publiée(s) récemment, correspondant aux mots-clés de vos CV publiés :</p><ul style="padding-left:18px;">${listItems}</ul>`,
    ),
    text: `${greeting}\n\nVoici ${notifications.length} offre(s) publiée(s) récemment, correspondant aux mots-clés de vos CV publiés :\n\n${notifications.map((n) => `${n.jobPostingTitle} — ${n.companyName} : ${env.BACKEND_URL}/${env.API_V1_URL}/candidate-notifications/${n.notificationId}/click`).join("\n")}`,
  });
}

/**
 * Notifie un administrateur d'entreprise qu'une candidature vient d'être
 * reçue — envoyée immédiatement à la soumission (voir createJobApplication),
 * jamais groupée : le volume attendu par entreprise reste faible (quelques
 * candidatures par offre), contrairement au flux candidat qui peut recevoir
 * des correspondances sur de nombreuses offres à la fois.
 */
export async function sendCompanyApplicationNotificationEmail(
  to: string,
  adminFullName: string | null,
  companyName: string,
  jobPostingTitle: string,
  candidateFullName: string,
) {
  const greeting = adminFullName ? `Bonjour ${adminFullName},` : "Bonjour,";
  const url = `${env.FRONTEND_URL}/app`;
  await sendMail({
    to,
    subject: `Nouvelle candidature — ${jobPostingTitle}`,
    html: wrapHtml(
      "Nouvelle candidature reçue",
      `<p>${greeting}</p><p><strong>${escapeHtml(candidateFullName)}</strong> vient de postuler à l'offre « ${escapeHtml(jobPostingTitle)} » chez ${escapeHtml(companyName)}.</p><p>Consultez la candidature depuis votre espace Recrutement.</p>`,
      "Voir les candidatures",
      url,
    ),
    text: `${greeting}\n\n${candidateFullName} vient de postuler à l'offre « ${jobPostingTitle} » chez ${companyName}.\n\nConsultez la candidature depuis votre espace Recrutement : ${url}`,
  });
}

import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { sendCandidateJobNotificationDigest } from "@/modules/email/email.service";
import { listConversations } from "@/modules/conversations/conversations.service";
import { getIO, isIOReady } from "@/realtime/io";
import { emitCandidateNotificationsChanged } from "@/realtime/notificationsSocket";
import { cvMatchesJobPosting } from "./engine/matchingEngine";

/**
 * Cible les candidats dont au moins un CV public correspond au titre de
 * l'offre (moteur de mots-clés), crée une notification par candidat ciblé —
 * jamais une par CV : un candidat avec plusieurs CV publics correspondants
 * ne doit recevoir qu'une seule notification pour une même offre — puis
 * envoie IMMÉDIATEMENT l'email à chacun (une notification = un email, pas de
 * digest différé : décision produit explicite, la notification doit être
 * instantanée). L'envoi reste séquentiel, candidat par candidat, avec l'échec
 * de l'un isolé des autres — cohérent avec runAllCandidatesNotificationDigests,
 * qui reste le filet de sécurité si un envoi échoue ici (emailedAt non posé,
 * repris au prochain passage du planificateur quotidien).
 */
export async function createNotificationsForJobPosting(
  jobPostingId: string,
): Promise<{ targetedCount: number }> {
  const posting = await prisma.jobPosting.findUnique({
    where: { id: jobPostingId },
    include: { company: { select: { name: true } } },
  });
  if (!posting) throw AppError.notFound("Offre introuvable");

  const publicCvs = await prisma.candidateCv.findMany({
    where: { visibility: "Public" },
    include: { skills: true },
  });

  const targetedCandidateIds = new Set<string>();
  for (const cv of publicCvs) {
    if (targetedCandidateIds.has(cv.candidateId)) continue; // déjà ciblé via un autre CV
    if (
      cvMatchesJobPosting(
        {
          title: cv.title,
          skillTitles: cv.skills.map(
            (s: (typeof cv.skills)[number]) => s.title,
          ),
        },
        posting.title,
      )
    ) {
      targetedCandidateIds.add(cv.candidateId);
    }
  }

  if (targetedCandidateIds.size === 0) return { targetedCount: 0 };

  const result = await prisma.candidateJobNotification.createMany({
    data: [...targetedCandidateIds].map((candidateId) => ({
      candidateId,
      jobPostingId,
    })),
    skipDuplicates: true,
  });

  // Ne traite QUE les notifications réellement créées à l'instant (emailedAt
  // encore null) — skipDuplicates aurait pu ignorer un candidat déjà notifié
  // pour cette offre par un appel antérieur, qu'il ne faut jamais re-notifier.
  const freshNotifications = await prisma.candidateJobNotification.findMany({
    where: {
      jobPostingId,
      candidateId: { in: [...targetedCandidateIds] },
      emailedAt: null,
    },
    include: { candidate: { select: { email: true, fullName: true } } },
  });

  for (const notification of freshNotifications) {
    // La notification existe déjà en base à ce stade — le signal temps réel
    // part indépendamment du succès de l'email juste en dessous, jamais
    // conditionné par lui.
    if (isIOReady())
      emitCandidateNotificationsChanged(getIO(), notification.candidateId);

    try {
      await sendCandidateJobNotificationDigest(
        notification.candidate.email,
        notification.candidate.fullName,
        [
          {
            notificationId: notification.id,
            jobPostingTitle: posting.title,
            companyName: posting.company.name,
          },
        ],
      );
      await prisma.candidateJobNotification.update({
        where: { id: notification.id },
        data: { emailedAt: new Date() },
      });
    } catch (err) {
      console.error(
        `❌ Échec de l'envoi instantané au candidat ${notification.candidateId} :`,
        err,
      );
    }
  }

  return { targetedCount: result.count };
}

/**
 * Filet de sécurité — regroupe et envoie les notifications qui n'ont pas pu
 * être emailées immédiatement à la publication (échec réseau, SMTP
 * temporairement indisponible...). Le chemin principal est désormais l'envoi
 * instantané dans createNotificationsForJobPosting ; cette fonction ne
 * traite que ce qui reste en attente, via le planificateur quotidien.
 */
export async function sendCandidateNotificationDigest(
  candidateId: string,
): Promise<{ notifCount: number }> {
  const pending = await prisma.candidateJobNotification.findMany({
    where: { candidateId, emailedAt: null },
    include: {
      jobPosting: { include: { company: { select: { name: true } } } },
    },
  });
  if (pending.length === 0) return { notifCount: 0 };

  const candidate = await prisma.candidate.findUniqueOrThrow({
    where: { id: candidateId },
  });

  await sendCandidateJobNotificationDigest(
    candidate.email,
    candidate.fullName,
    pending.map((n: (typeof pending)[number]) => ({
      notificationId: n.id,
      jobPostingTitle: n.jobPosting.title,
      companyName: n.jobPosting.company.name,
    })),
  );

  await prisma.candidateJobNotification.updateMany({
    where: { id: { in: pending.map((n: (typeof pending)[number]) => n.id) } },
    data: { emailedAt: new Date() },
  });

  return { notifCount: pending.length };
}

/** Exécute le digest pour TOUS les candidats ayant des notifications en
 * attente — cible du planificateur quotidien, isole l'échec d'un candidat
 * sans faire planter les autres (même patron que runAllCompaniesAlertDigests). */
export async function runAllCandidatesNotificationDigests(): Promise<
  { candidateId: string; notifCount: number }[]
> {
  const pendingCandidateIds = await prisma.candidateJobNotification.findMany({
    where: { emailedAt: null },
    select: { candidateId: true },
    distinct: ["candidateId"],
  });

  const results = [];
  for (const { candidateId } of pendingCandidateIds) {
    try {
      const { notifCount } = await sendCandidateNotificationDigest(candidateId);
      if (notifCount > 0) results.push({ candidateId, notifCount });
    } catch (err) {
      console.error(
        `❌ Échec du digest de notifications pour le candidat ${candidateId} :`,
        err,
      );
    }
  }
  return results;
}

// ---------- Espace candidat (in-app) ----------

/**
 * Fusionne trois sources de notification candidate (offres correspondantes,
 * messages de contact CV, et conversations de messagerie non lues) en une
 * seule liste triée par date — le candidat voit tout au même endroit, peu
 * importe l'origine. Un discriminant `type` permet au frontend d'adapter
 * l'affichage sans dupliquer la requête. Une conversation compte comme UNE
 * seule entrée peu importe son nombre de messages non lus — le grain est la
 * conversation, pas le message, cohérent avec ce que montre déjà l'espace
 * Messagerie lui-même.
 */
export async function listCandidateNotifications(candidateId: string) {
  const [jobNotifications, contactNotifications, conversations] =
    await Promise.all([
      prisma.candidateJobNotification.findMany({
        where: { candidateId },
        include: {
          jobPosting: {
            include: {
              company: { select: { id: true, name: true, logoUrl: true } },
            },
          },
        },
      }),
      prisma.candidateContactNotification.findMany({ where: { candidateId } }),
      listConversations({ type: "CANDIDATE", candidateId }),
    ]);

  const unreadConversations = conversations.filter(
    (c: (typeof conversations)[number]) => c.unread && c.lastMessage,
  );

  const merged = [
    ...jobNotifications.map((n: (typeof jobNotifications)[number]) => ({
      type: "job_match" as const,
      ...n,
    })),
    ...contactNotifications.map((n: (typeof contactNotifications)[number]) => ({
      type: "contact_message" as const,
      ...n,
    })),
    ...unreadConversations.map((c: (typeof unreadConversations)[number]) => ({
      type: "new_message" as const,
      id: c.id,
      conversationId: c.id,
      otherParticipant: c.otherParticipant,
      lastMessage: c.lastMessage!,
      createdAt: c.lastMessage!.createdAt,
      readAt: null,
    })),
  ];

  return merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Idempotent — un second appel sur une notification déjà lue ne fait rien,
 * jamais d'erreur (un clic répété sur le lien de l'email doit rester silencieux). */
export async function markNotificationRead(
  notificationId: string,
): Promise<{ jobPostingId: string }> {
  const notification = await prisma.candidateJobNotification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) throw AppError.notFound("Notification introuvable");

  if (!notification.readAt) {
    await prisma.candidateJobNotification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }
  return { jobPostingId: notification.jobPostingId };
}

/** Pendant de markNotificationRead pour les messages de contact — jamais de
 * lien de clic email pour ce type (sendCandidateContactEmail n'en émet pas),
 * seulement un marquage manuel depuis l'espace in-app. */
export async function markContactNotificationRead(
  notificationId: string,
): Promise<void> {
  const notification = await prisma.candidateContactNotification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) throw AppError.notFound("Notification introuvable");

  if (!notification.readAt) {
    await prisma.candidateContactNotification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }
}

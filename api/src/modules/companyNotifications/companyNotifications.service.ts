import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getMemberCompanyOrThrow } from "@/modules/companies/companies.service";
import { sendCompanyApplicationNotificationEmail } from "@/modules/email/email.service";
import { listConversations } from "@/modules/conversations/conversations.service";
import { getIO, isIOReady } from "@/realtime/io";
import { emitCompanyNotificationsChanged } from "@/realtime/notificationsSocket";

/**
 * Crée la notification d'entreprise ET envoie l'email immédiatement aux
 * administrateurs — appelée à la soumission d'une candidature (voir
 * jobApplications.service.ts, en fire-and-forget comme pour les notifications
 * candidates). Réservé aux ADMIN, pas tous les MEMBER : une candidature est
 * une donnée RH-adjacente, cohérent avec le reste du produit qui restreint
 * déjà les données sensibles aux administrateurs.
 */
export async function createNotificationForApplication(
  jobApplicationId: string,
): Promise<void> {
  const application = await prisma.jobApplication.findUnique({
    where: { id: jobApplicationId },
    include: {
      jobPosting: {
        include: { company: { select: { id: true, name: true } } },
      },
      candidate: { select: { fullName: true } },
    },
  });
  if (!application) throw AppError.notFound("Candidature introuvable");

  await prisma.companyApplicationNotification.create({
    data: { companyId: application.jobPosting.companyId, jobApplicationId },
  });

  if (isIOReady())
    emitCompanyNotificationsChanged(getIO(), application.jobPosting.companyId);

  const admins = await prisma.companyMember.findMany({
    where: { companyId: application.jobPosting.companyId, role: "ADMIN" },
    include: { user: { select: { email: true, fullName: true } } },
  });

  for (const admin of admins) {
    try {
      await sendCompanyApplicationNotificationEmail(
        admin.user.email,
        admin.user.fullName,
        application.jobPosting.company.name,
        application.jobPosting.title,
        application.candidate.fullName,
      );
    } catch (err) {
      console.error(
        `❌ Échec de l'envoi instantané à l'administrateur ${admin.userId} :`,
        err,
      );
    }
  }
}

/**
 * Fusionne deux sources de notification entreprise (nouvelles candidatures
 * et conversations de messagerie non lues) en une seule liste triée par
 * date, avec un discriminant `type` — même patron que côté candidat. Une
 * conversation compte comme UNE seule entrée peu importe son nombre de
 * messages non lus, cohérent avec ce que montre déjà l'espace Messagerie.
 */
export async function listCompanyNotifications(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getMemberCompanyOrThrow(companyId, auth);

  const [applicationNotifications, conversations] = await Promise.all([
    prisma.companyApplicationNotification.findMany({
      where: { companyId },
      include: {
        jobApplication: {
          include: {
            jobPosting: { select: { id: true, title: true } },
            candidate: { select: { fullName: true } },
          },
        },
      },
    }),
    listConversations({ type: "COMPANY", companyId, userId: auth.userId }),
  ]);

  const unreadConversations = conversations.filter(
    (c: (typeof conversations)[number]) => c.unread && c.lastMessage,
  );

  const merged = [
    ...applicationNotifications.map(
      (n: (typeof applicationNotifications)[number]) => ({
        type: "application" as const,
        ...n,
      }),
    ),
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

/** Idempotent — un second appel sur une notification déjà lue ne fait rien. */
export async function markCompanyNotificationRead(
  notificationId: string,
  auth: AuthenticatedUser,
): Promise<void> {
  const notification = await prisma.companyApplicationNotification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) throw AppError.notFound("Notification introuvable");
  await getMemberCompanyOrThrow(notification.companyId, auth);

  if (!notification.readAt) {
    await prisma.companyApplicationNotification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }
}

import { prisma } from "@/config/prisma";
import { sendContactNotification } from "@/modules/email/email.service";
import { ContactInput } from "./contact.schemas";

export async function createContactMessage(
  input: Omit<ContactInput, "website">,
) {
  const message = await prisma.contactMessage.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      subject: input.subject,
      message: input.message,
    },
  });
  // L'échec de l'email ne doit jamais empêcher l'enregistrement du message
  // (voir sendMail() : erreurs déjà capturées en interne, jamais propagées ici).
  await sendContactNotification(input);
  return message;
}

export interface ListMessagesParams {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

export async function listContactMessages({
  page = 1,
  pageSize = 20,
  unreadOnly = false,
}: ListMessagesParams) {
  const where = unreadOnly ? { isRead: false } : {};
  const [items, total, unreadCount] = await prisma.$transaction([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);
  return {
    items,
    total,
    unreadCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function markContactMessageAsRead(id: string, isRead: boolean) {
  return prisma.contactMessage.update({ where: { id }, data: { isRead } });
}

export async function deleteContactMessage(id: string) {
  await prisma.contactMessage.delete({ where: { id } });
}

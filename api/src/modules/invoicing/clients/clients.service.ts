import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { companyMemberWhereNested } from "@/utils/authContext";
import { getMemberCompanyOrThrow } from "@/modules/companies/companies.service";
import { generateClientCode } from "@/utils/codeGenerator";
import { CreateClientInput, UpdateClientInput } from "./clients.schemas";

export async function getOwnedClientOrThrow(
  clientId: string,
  auth: AuthenticatedUser,
) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, ...companyMemberWhereNested(auth) },
  });
  if (!client) throw AppError.notFound("Client introuvable");
  return client;
}

export async function listClients(companyId: string, auth: AuthenticatedUser) {
  await getMemberCompanyOrThrow(companyId, auth);
  return prisma.client.findMany({
    where: { companyId },
    orderBy: { code: "asc" },
  });
}

export async function createClient(
  companyId: string,
  auth: AuthenticatedUser,
  input: CreateClientInput,
) {
  await getMemberCompanyOrThrow(companyId, auth);
  const code = await generateClientCode(companyId);
  return prisma.client.create({ data: { ...input, companyId, code } });
}

export async function updateClient(
  clientId: string,
  auth: AuthenticatedUser,
  input: UpdateClientInput,
) {
  await getOwnedClientOrThrow(clientId, auth);
  return prisma.client.update({ where: { id: clientId }, data: input });
}

export async function deleteClient(clientId: string, auth: AuthenticatedUser) {
  await getOwnedClientOrThrow(clientId, auth);
  const documentsCount = await prisma.salesDocument.count({
    where: { clientId },
  });
  if (documentsCount > 0) {
    throw AppError.conflict(
      `Ce client a ${documentsCount} document(s) commercial(aux) associé(s) et ne peut pas être supprimé.`,
    );
  }
  await prisma.client.delete({ where: { id: clientId } });
}

import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { companyMemberWhereNested } from "@/utils/authContext";
import { getMemberCompanyOrThrow } from "@/modules/companies/companies.service";
import { generateSupplierCode } from "@/utils/codeGenerator";
import { CreateSupplierInput, UpdateSupplierInput } from "./suppliers.schemas";

export async function getOwnedSupplierOrThrow(
  supplierId: string,
  auth: AuthenticatedUser,
) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, ...companyMemberWhereNested(auth) },
  });
  if (!supplier) throw AppError.notFound("Fournisseur introuvable");
  return supplier;
}

export async function listSuppliers(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getMemberCompanyOrThrow(companyId, auth);
  return prisma.supplier.findMany({
    where: { companyId },
    orderBy: { code: "asc" },
  });
}

export async function createSupplier(
  companyId: string,
  auth: AuthenticatedUser,
  input: CreateSupplierInput,
) {
  await getMemberCompanyOrThrow(companyId, auth);
  const code = await generateSupplierCode(companyId);
  return prisma.supplier.create({ data: { ...input, companyId, code } });
}

export async function updateSupplier(
  supplierId: string,
  auth: AuthenticatedUser,
  input: UpdateSupplierInput,
) {
  await getOwnedSupplierOrThrow(supplierId, auth);
  return prisma.supplier.update({ where: { id: supplierId }, data: input });
}

export async function deleteSupplier(
  supplierId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedSupplierOrThrow(supplierId, auth);
  const documentsCount = await prisma.purchaseDocument.count({
    where: { supplierId },
  });
  if (documentsCount > 0) {
    throw AppError.conflict(
      `Ce fournisseur a ${documentsCount} document(s) d'achat associé(s) et ne peut pas être supprimé.`,
    );
  }
  await prisma.supplier.delete({ where: { id: supplierId } });
}

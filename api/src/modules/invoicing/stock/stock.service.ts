import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { isSuperAdmin } from "@/utils/authContext";
import { getOwnedProductOrThrow } from "@/modules/invoicing/products/products.service";
import { CreateMovementInput } from "./stock.schemas";

export async function listMovements(
  productId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedProductOrThrow(productId, auth);
  return prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { date: "desc" },
  });
}

export async function createMovement(
  productId: string,
  auth: AuthenticatedUser,
  input: CreateMovementInput,
) {
  const product = await getOwnedProductOrThrow(productId, auth);
  if (!product.trackInventory) {
    throw AppError.badRequest(
      "Cet article n'est pas suivi en inventaire (activez le suivi de stock avant d'enregistrer un mouvement).",
    );
  }
  return prisma.stockMovement.create({ data: { ...input, productId } });
}

export async function deleteMovement(id: string, auth: AuthenticatedUser) {
  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: {
      product: { include: { company: { include: { members: true } } } },
    },
  });
  if (!movement) throw AppError.notFound("Mouvement introuvable");

  const { company } = movement.product;
  const hasAccess =
    isSuperAdmin(auth.role) ||
    company.userId === auth.userId ||
    company.members.some(
      (m: (typeof company.members)[number]) => m.userId === auth.userId,
    );
  if (!hasAccess) throw AppError.notFound("Mouvement introuvable");

  await prisma.stockMovement.delete({ where: { id } });
}

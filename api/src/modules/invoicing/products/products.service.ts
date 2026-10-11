import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { companyMemberWhereNested } from "@/utils/authContext";
import { getMemberCompanyOrThrow } from "@/modules/companies/companies.service";
import {
  computeStock,
  sumMovements,
} from "@/modules/invoicing/engine/inventoryEngine";
import { generateProductCode } from "@/utils/codeGenerator";
import { CreateProductInput, UpdateProductInput } from "./products.schemas";

export async function getOwnedProductOrThrow(
  productId: string,
  auth: AuthenticatedUser,
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, ...companyMemberWhereNested(auth) },
  });
  if (!product) throw AppError.notFound("Article introuvable");
  return product;
}

async function withStockCalc(product: {
  id: string;
  stockInitial: unknown;
  stockMin: unknown;
  unitCost: unknown;
  trackInventory: boolean;
  [key: string]: unknown;
}) {
  if (!product.trackInventory) return { ...product, stock: null };

  const movements = await prisma.stockMovement.findMany({
    where: { productId: product.id },
  });
  const { entries, exits } = sumMovements(
    movements.map((m: (typeof movements)[number]) => ({
      type: m.type,
      quantity: Number(m.quantity),
    })),
  );
  const stock = computeStock({
    stockInitial: Number(product.stockInitial),
    entries,
    exits,
    stockMin: Number(product.stockMin),
    unitCost: Number(product.unitCost ?? 0),
  });

  return { ...product, stock };
}

export async function listProducts(companyId: string, auth: AuthenticatedUser) {
  await getMemberCompanyOrThrow(companyId, auth);
  const products = await prisma.product.findMany({
    where: { companyId },
    orderBy: { code: "asc" },
  });
  return Promise.all(
    products.map(async (p: (typeof products)[number]) => ({
      ...p,
      ...(await withStockCalc(p)),
    })),
  );
}

export async function createProduct(
  companyId: string,
  auth: AuthenticatedUser,
  input: CreateProductInput,
) {
  await getMemberCompanyOrThrow(companyId, auth);
  const code = await generateProductCode(companyId);
  const product = await prisma.product.create({
    data: { ...input, companyId, code },
  });
  return withStockCalc(product);
}

export async function getProduct(productId: string, auth: AuthenticatedUser) {
  const product = await getOwnedProductOrThrow(productId, auth);
  return withStockCalc(product);
}

export async function updateProduct(
  productId: string,
  auth: AuthenticatedUser,
  input: UpdateProductInput,
) {
  await getOwnedProductOrThrow(productId, auth);
  const product = await prisma.product.update({
    where: { id: productId },
    data: input,
  });
  return withStockCalc(product);
}

export async function deleteProduct(
  productId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedProductOrThrow(productId, auth);
  const linesCount = await prisma.salesDocumentLine.count({
    where: { productId },
  });
  if (linesCount > 0) {
    throw AppError.conflict(
      `Cet article apparaît dans ${linesCount} document(s) commercial(aux) et ne peut pas être supprimé.`,
    );
  }
  await prisma.product.delete({ where: { id: productId } });
}

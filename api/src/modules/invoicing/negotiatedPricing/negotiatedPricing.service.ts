import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedClientOrThrow } from "@/modules/invoicing/clients/clients.service";
import { resolveLinePrice } from "./negotiatedPricingEngine";
import { CreateNegotiatedPriceInput } from "./negotiatedPricing.schemas";

export async function listNegotiatedPrices(
  clientId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedClientOrThrow(clientId, auth);
  return prisma.clientProductPrice.findMany({
    where: { clientId },
    include: {
      product: {
        select: {
          id: true,
          code: true,
          designation: true,
          sellingPriceHT: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Un prix négocié par (client, article) — la contrainte d'unicité empêche
 * d'en créer un second pour le même couple ; modifier un prix existant passe
 * donc par la mise à jour, jamais par une nouvelle création en double. */
export async function upsertNegotiatedPrice(
  clientId: string,
  auth: AuthenticatedUser,
  input: CreateNegotiatedPriceInput,
) {
  const client = await getOwnedClientOrThrow(clientId, auth);

  const product = await prisma.product.findFirst({
    where: { id: input.productId, companyId: client.companyId },
  });
  if (!product)
    throw AppError.badRequest(
      "Article introuvable dans le catalogue de l'entreprise",
    );

  return prisma.clientProductPrice.upsert({
    where: { clientId_productId: { clientId, productId: input.productId } },
    create: {
      clientId,
      productId: input.productId,
      unitPriceHT: input.unitPriceHT,
      notes: input.notes,
    },
    update: { unitPriceHT: input.unitPriceHT, notes: input.notes },
    include: {
      product: {
        select: {
          id: true,
          code: true,
          designation: true,
          sellingPriceHT: true,
        },
      },
    },
  });
}

export async function deleteNegotiatedPrice(
  priceId: string,
  auth: AuthenticatedUser,
) {
  const price = await prisma.clientProductPrice.findUnique({
    where: { id: priceId },
    include: { client: true },
  });
  if (!price) throw AppError.notFound("Prix négocié introuvable");
  await getOwnedClientOrThrow(price.clientId, auth);
  await prisma.clientProductPrice.delete({ where: { id: priceId } });
}

/**
 * Résout le prix effectif proposé pour un couple (client, article) — appelé
 * par le frontend au moment où l'utilisateur choisit un article dans une
 * ligne de document, pour préremplir le bon prix par défaut. Ne fait
 * qu'une PROPOSITION : l'utilisateur reste toujours libre de modifier
 * manuellement la ligne au cas par cas.
 */
export async function resolveEffectivePrice(
  clientId: string,
  productId: string,
  auth: AuthenticatedUser,
) {
  const client = await getOwnedClientOrThrow(clientId, auth);

  const [product, negotiatedPrice] = await Promise.all([
    prisma.product.findFirst({
      where: { id: productId, companyId: client.companyId },
    }),
    prisma.clientProductPrice.findUnique({
      where: { clientId_productId: { clientId, productId } },
    }),
  ]);
  if (!product)
    throw AppError.badRequest(
      "Article introuvable dans le catalogue de l'entreprise",
    );

  const resolvedPriceHT = resolveLinePrice({
    catalogPriceHT: Number(product.sellingPriceHT),
    negotiatedPriceHT: negotiatedPrice
      ? Number(negotiatedPrice.unitPriceHT)
      : null,
    clientDiscountPercent: client.defaultDiscountPercent
      ? Number(client.defaultDiscountPercent)
      : null,
  });

  return {
    resolvedPriceHT,
    catalogPriceHT: Number(product.sellingPriceHT),
    source: negotiatedPrice
      ? ("negotiated" as const)
      : client.defaultDiscountPercent
        ? ("discount" as const)
        : ("catalog" as const),
  };
}

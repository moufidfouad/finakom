import { prisma } from "@/config/prisma";

/**
 * Génère le prochain code auto-incrémenté par entreprise (ex: CLI-001, ART-014).
 * Se base sur le MAX du suffixe numérique existant plutôt qu'un simple COUNT :
 * un COUNT casserait dès qu'un enregistrement est supprimé au milieu de la séquence
 * (ex: 3 clients, suppression du n°2, un COUNT régénérerait "CLI-003" — déjà pris —
 * et violerait la contrainte d'unicité @@unique([companyId, code])).
 */
async function nextSequentialCode(params: {
  prefix: string;
  codes: string[];
}): Promise<string> {
  const pattern = new RegExp(`^${params.prefix}-(\\d+)$`);
  const maxNumber = params.codes.reduce((max, code) => {
    const match = pattern.exec(code);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);
  return `${params.prefix}-${String(maxNumber + 1).padStart(3, "0")}`;
}

export async function generateClientCode(companyId: string): Promise<string> {
  const clients = await prisma.client.findMany({
    where: { companyId },
    select: { code: true },
  });
  return nextSequentialCode({
    prefix: "CLI",
    codes: clients.map((c: { code: string }) => c.code),
  });
}

export async function generateProductCode(companyId: string): Promise<string> {
  const products = await prisma.product.findMany({
    where: { companyId },
    select: { code: true },
  });
  return nextSequentialCode({
    prefix: "ART",
    codes: products.map((p: { code: string }) => p.code),
  });
}

export async function generateEmployeeCode(companyId: string): Promise<string> {
  const employees = await prisma.employee.findMany({
    where: { companyId },
    select: { code: true },
  });
  return nextSequentialCode({
    prefix: "EMP",
    codes: employees.map((e: { code: string }) => e.code),
  });
}

export async function generateFixedAssetCode(
  companyId: string,
): Promise<string> {
  const assets = await prisma.fixedAsset.findMany({
    where: { companyId },
    select: { code: true },
  });
  return nextSequentialCode({
    prefix: "IMM",
    codes: assets.map((a: { code: string }) => a.code),
  });
}

export async function generateSupplierCode(companyId: string): Promise<string> {
  const suppliers = await prisma.supplier.findMany({
    where: { companyId },
    select: { code: true },
  });
  return nextSequentialCode({
    prefix: "FRS",
    codes: suppliers.map((s: { code: string }) => s.code),
  });
}

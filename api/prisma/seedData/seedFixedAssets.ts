/**
 * Module Immobilisations : registre varié (méthodes Linéaire, Dégressif, Non
 * amortissable), avec au moins une cession pour tester le calcul de plus ou
 * moins-value, et un mouvement d'acquisition tracé.
 */
import { PrismaClient } from "@prisma/client";
import { SeededCompany } from "./seedFoundation";

export async function seedFixedAssets(
  prisma: PrismaClient,
  company: SeededCompany,
) {
  await prisma.fixedAssetSettings.create({
    data: {
      companyId: company.id,
      fiscalYear: 2025,
      closingDate: new Date("2025-12-31"),
      corporealThreshold: 500000,
      incorporealThreshold: 300000,
      degressiveCoefficient: 1.5,
    },
  });

  const assetSpecs = [
    {
      code: "IMM-001",
      accountNumber: "213",
      acquisitionDate: new Date("2022-03-15"),
      designation: "Bâtiment siège social",
      category: "Bâtiment",
      location: "Moroni",
      method: "Linéaire",
      durationYears: 20,
      grossValue: 45000000,
    },
    {
      code: "IMM-002",
      accountNumber: "244",
      acquisitionDate: new Date("2023-01-10"),
      designation: "Véhicule de service",
      category: "Matériel transport",
      location: "Direction",
      method: "Linéaire",
      durationYears: 4,
      grossValue: 12500000,
    },
    {
      code: "IMM-003",
      accountNumber: "218",
      acquisitionDate: new Date("2024-01-20"),
      designation: "Serveur + équipements réseau",
      category: "Matériel informatique",
      location: "IT",
      method: "Dégressif",
      durationYears: 3,
      grossValue: 3500000,
    },
    {
      code: "IMM-004",
      accountNumber: "244",
      acquisitionDate: new Date("2023-09-01"),
      designation: "Mobilier de bureau",
      category: "Mobilier",
      location: "Bureaux",
      method: "Linéaire",
      durationYears: 5,
      grossValue: 1800000,
    },
    {
      code: "IMM-005",
      accountNumber: "211",
      acquisitionDate: new Date("2021-06-01"),
      designation: "Terrain attenant",
      category: "Terrain",
      location: "Moroni",
      method: "Non amortissable",
      durationYears: null,
      grossValue: 15000000,
    },
    {
      code: "IMM-006",
      accountNumber: "244",
      acquisitionDate: new Date("2020-05-10"),
      designation: "Ancien véhicule utilitaire (cédé)",
      category: "Matériel transport",
      location: "Direction",
      method: "Linéaire",
      durationYears: 5,
      grossValue: 8500000,
    },
  ];
  const createdAssets = [];
  for (const spec of assetSpecs) {
    const asset = await prisma.fixedAsset.create({
      data: {
        companyId: company.id,
        code: spec.code,
        accountNumber: spec.accountNumber,
        acquisitionDate: spec.acquisitionDate,
        designation: spec.designation,
        category: spec.category,
        location: spec.location,
        method: spec.method,
        durationYears: spec.durationYears,
        grossValue: Math.round(spec.grossValue * company.scale),
        createdById: company.creatorUserId,
      },
    });
    createdAssets.push(asset);
  }

  // Mouvement d'acquisition tracé pour le serveur (IMM-003).
  await prisma.assetMovement.create({
    data: {
      companyId: company.id,
      fixedAssetId: createdAssets[2].id,
      date: new Date("2024-01-20"),
      pieceNumber: "FA-2024-012",
      designation: createdAssets[2].designation,
      type: "Acquisition",
      amount: createdAssets[2].grossValue,
    },
  });

  // Cession de l'ancien véhicule (IMM-006) — pour tester le calcul de plus/moins-value.
  const disposalPrice = Math.round(2500000 * company.scale);
  await prisma.assetMovement.create({
    data: {
      companyId: company.id,
      fixedAssetId: createdAssets[5].id,
      date: new Date("2026-02-15"),
      pieceNumber: "FA-2026-003",
      designation: createdAssets[5].designation,
      type: "Cession",
      amount: createdAssets[5].grossValue,
      disposalPrice,
    },
  });
}

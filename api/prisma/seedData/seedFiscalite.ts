/**
 * Données fiscales de démonstration — TVA mensuelle, IS, patente, CNPS/IR
 * sur salaires, pour l'exercice en cours. Montants dérivés du facteur
 * scale de l'entreprise (même principe que buildBalanceLines) : l'échelle 1
 * reproduit approximativement les valeurs du tableur de référence fourni
 * (TDB FISCALITÉ PME OHADA), les autres entreprises varient proportionnellement.
 * TaxSettings n'est volontairement pas seedé explicitement — auto-créé avec
 * les valeurs par défaut du référentiel camerounais dès sa première
 * consultation (voir getOrCreateTaxSettings), cohérent avec le principe déjà
 * appliqué pour FixedAssetSettings et TreasurySettings dans ce même seed.
 */
import { PrismaClient } from "@prisma/client";
import { SeededCompany } from "./seedFoundation";

const VAT_RATE = 0.1925;

export async function seedFiscalite(
  prisma: PrismaClient,
  company: SeededCompany,
): Promise<void> {
  const year = new Date().getFullYear();
  const scale = company.scale;

  // TVA mensuelle — CA TTC croissant en cours d'année (saisonnalité simple),
  // achats TTC environ 40% du CA, cohérent avec le ratio du tableur source.
  for (let month = 0; month < 12; month++) {
    const baseRevenue = 580000 * scale * (1 + month * 0.04);
    await prisma.monthlyVatReturn.create({
      data: {
        companyId: company.id,
        period: new Date(Date.UTC(year, month, 1)),
        salesIncTax: Math.round(baseRevenue),
        purchasesIncTax: Math.round(baseRevenue * 0.4),
        status: month < 6 ? "Payée" : month < 10 ? "Déclarée" : "À déclarer",
      },
    });
  }

  // Impôt sur les sociétés — un enregistrement pour l'exercice en cours,
  // reproduisant la structure du cas de référence du tableur à l'échelle
  // de l'entreprise.
  await prisma.corporateTaxReturn.create({
    data: {
      companyId: company.id,
      fiscalYear: year,
      accountingResult: Math.round(12500000 * scale),
      fiscalReintegrations: Math.round(500000 * scale),
      fiscalDeductions: Math.round(200000 * scale),
      priorYearLoss: 0,
      annualRevenue: Math.round(50000000 * scale),
      priorYearTax: Math.round(4200000 * scale),
      taxCredits: 0,
      installmentsPaidQ1: Math.round(1050000 * scale),
      installmentsPaidQ2: Math.round(1050000 * scale),
      installmentsPaidQ3: 0, // les deux derniers trimestres pas encore versés — cohérent avec un exercice en cours
      installmentsPaidQ4: 0,
    },
  });

  // Patente — un enregistrement annuel.
  await prisma.businessLicenseReturn.create({
    data: {
      companyId: company.id,
      fiscalYear: year,
      annualRevenue: Math.round(50000000 * scale),
      fixedDuty: scale >= 1.5 ? 200000 : 0, // catégorie C dès une certaine taille, cohérent avec le barème de référence
      paid: false,
    },
  });

  // CNPS + IR sur salaires — masse salariale mensuelle croissante,
  // cohérente avec le nombre d'employés variable déjà seedé par ailleurs
  // (module hr) sans reprendre directement ces montants (voir la limite déjà
  // documentée dans payrollTaxEngine.ts : cette v1 reste une saisie
  // indépendante, pas encore reliée à Payroll).
  for (let month = 0; month < 12; month++) {
    const grossPayroll = 850000 * scale * (1 + Math.floor(month / 4) * 0.2);
    await prisma.monthlyPayrollTax.create({
      data: {
        companyId: company.id,
        period: new Date(Date.UTC(year, month, 1)),
        grossPayroll: Math.round(grossPayroll),
        paid: month < 9,
      },
    });
  }
}

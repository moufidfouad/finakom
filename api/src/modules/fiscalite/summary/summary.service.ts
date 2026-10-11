import { AuthenticatedUser } from "@/types/express";
import { getVatYearSummary } from "@/modules/fiscalite/vat/vat.service";
import { getCorporateTaxSummary } from "@/modules/fiscalite/corporateTax/corporateTax.service";
import { getBusinessLicenseSummary } from "@/modules/fiscalite/businessLicense/businessLicense.service";
import { getPayrollTaxYearSummary } from "@/modules/fiscalite/payrollTax/payrollTax.service";

const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export interface FiscalDeadline {
  month: string;
  taxType: string;
  description: string;
  dueDate: string; // JJ/MM
  amount: number;
  legalReference: string;
}

/**
 * Le calendrier fiscal n'est jamais saisi séparément — il n'existe dans le
 * modèle source que comme une VUE dérivée des quatre calculs déjà faits
 * ailleurs (TVA mensuelle, acomptes IS, patente, CNPS+IR). Le construire
 * comme une cinquième table à saisir aurait dupliqué des données déjà
 * présentes et risqué de les faire diverger — génère plutôt cette liste
 * chronologique en agrégeant les quatre services existants à la volée.
 */
export async function getFiscalCalendar(
  companyId: string,
  auth: AuthenticatedUser,
  year: number,
): Promise<FiscalDeadline[]> {
  const [vatMonths, payrollMonths, corporateTax, businessLicense] =
    await Promise.all([
      getVatYearSummary(companyId, auth, year),
      getPayrollTaxYearSummary(companyId, auth, year),
      getCorporateTaxSummary(companyId, auth, year),
      getBusinessLicenseSummary(companyId, auth, year, 0),
    ]);

  const deadlines: FiscalDeadline[] = [];

  // TVA et CNPS+IR — échéance mensuelle, le 15 du mois suivant la période.
  for (let i = 0; i < 12; i++) {
    const declarationMonth = MONTH_NAMES[(i + 1) % 12];
    deadlines.push({
      month: declarationMonth,
      taxType: "TVA",
      description: `TVA ${MONTH_NAMES[i]}`,
      dueDate: "15",
      amount: vatMonths[i].vatToPay,
      legalReference: "CGI Art. 128 — DGI",
    });
    deadlines.push({
      month: declarationMonth,
      taxType: "CNPS",
      description: `CNPS + IR ${MONTH_NAMES[i]}`,
      dueDate: "15",
      amount: payrollMonths[i].totalToPay + payrollMonths[i].monthlyIncomeTax,
      legalReference: "Code Travail Art. 35 — CNPS",
    });
  }

  // Acomptes IS trimestriels — dates fixes.
  const installments: [string, number][] = [
    ["Mars", corporateTax.quarterlyInstallmentAmount],
    ["Juin", corporateTax.quarterlyInstallmentAmount],
    ["Septembre", corporateTax.quarterlyInstallmentAmount],
    ["Décembre", corporateTax.quarterlyInstallmentAmount],
  ];
  for (const [month, amount] of installments) {
    deadlines.push({
      month,
      taxType: "IS",
      description: "Acompte IS trimestriel",
      dueDate: "15",
      amount,
      legalReference: "CGI Art. 22 — IS / BAIOP",
    });
  }

  // Échéances annuelles.
  deadlines.push({
    month: "Mars",
    taxType: "Patente",
    description: "Patente annuelle",
    dueDate: "31",
    amount: businessLicense.totalDue,
    legalReference: "CGI Art. 444",
  });
  deadlines.push({
    month: "Mars",
    taxType: "DSF",
    description: "Déclaration Statistique et Fiscale annuelle",
    dueDate: "31",
    amount: 0,
    legalReference: "Loi de finances",
  });

  return deadlines.sort(
    (a, b) => MONTH_NAMES.indexOf(a.month) - MONTH_NAMES.indexOf(b.month),
  );
}

export interface FiscalRecapLine {
  taxType: string;
  base: number;
  amountDue: number;
  legalReference: string;
}

/** Synthèse annuelle par type d'impôt — même principe que le calendrier :
 * dérivée à la volée, jamais stockée séparément. */
export async function getFiscalRecap(
  companyId: string,
  auth: AuthenticatedUser,
  year: number,
) {
  const [vatMonths, payrollMonths, corporateTax, businessLicense] =
    await Promise.all([
      getVatYearSummary(companyId, auth, year),
      getPayrollTaxYearSummary(companyId, auth, year),
      getCorporateTaxSummary(companyId, auth, year),
      getBusinessLicenseSummary(companyId, auth, year, 0),
    ]);

  const totalVatNet = vatMonths.reduce(
    (sum: number, m: (typeof vatMonths)[number]) => sum + m.netBeforeCredit,
    0,
  );
  const totalVatBase = vatMonths.reduce(
    (sum: number, m: (typeof vatMonths)[number]) => sum + m.salesExTax,
    0,
  );
  const totalGrossPayroll = payrollMonths.reduce(
    (sum: number, m: (typeof payrollMonths)[number]) => sum + m.grossPayroll,
    0,
  );
  const totalEmployerContribution = payrollMonths.reduce(
    (sum: number, m: (typeof payrollMonths)[number]) =>
      sum + m.employerContribution,
    0,
  );
  const totalEmployeeContribution = payrollMonths.reduce(
    (sum: number, m: (typeof payrollMonths)[number]) =>
      sum + m.employeeContribution,
    0,
  );
  const totalVocationalTraining = payrollMonths.reduce(
    (sum: number, m: (typeof payrollMonths)[number]) =>
      sum + m.vocationalTraining,
    0,
  );
  const totalMonthlyIncomeTax = payrollMonths.reduce(
    (sum: number, m: (typeof payrollMonths)[number]) =>
      sum + m.monthlyIncomeTax,
    0,
  );

  const lines: FiscalRecapLine[] = [
    {
      taxType: "TVA nette due (annuelle)",
      base: totalVatBase,
      amountDue: totalVatNet,
      legalReference: "CGI Art. 128",
    },
    {
      taxType: "Impôt sur les sociétés (IS)",
      base: corporateTax.fiscalResult,
      amountDue: corporateTax.netTaxPayable,
      legalReference: "CGI Art. 22",
    },
    {
      taxType: "Patente",
      base: businessLicense.annualRevenue,
      amountDue: businessLicense.totalDue,
      legalReference: "CGI Art. 444",
    },
    {
      taxType: "CNPS patronal",
      base: totalGrossPayroll,
      amountDue: totalEmployerContribution,
      legalReference: "Code Travail Art. 35",
    },
    {
      taxType: "CNPS salarial (retenu)",
      base: totalGrossPayroll,
      amountDue: totalEmployeeContribution,
      legalReference: "Code Travail Art. 35",
    },
    {
      taxType: "FAC",
      base: totalGrossPayroll,
      amountDue: totalVocationalTraining,
      legalReference: "Loi Artisanat",
    },
    {
      taxType: "IR sur salaires (retenu)",
      base: totalGrossPayroll,
      amountDue: totalMonthlyIncomeTax,
      legalReference: "CGI Art. 74",
    },
    {
      taxType: "Acomptes IS versés",
      base: 0,
      amountDue: corporateTax.totalInstallmentsPaid,
      legalReference: "CGI Art. 22",
    },
  ];

  const totalTaxesAndDues = lines.reduce((sum, l) => sum + l.amountDue, 0);
  const taxPressureRate =
    totalVatBase > 0 ? totalTaxesAndDues / totalVatBase : 0;

  return { year, lines, totalTaxesAndDues, taxPressureRate };
}

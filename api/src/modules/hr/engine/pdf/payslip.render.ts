import { formatAmountForPdf as formatAmount } from "@/utils/pdfText";
import { drawCompanyLogo } from "@/utils/pdfLogo";

const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function labelAmountRow(
  pdf: PDFKit.PDFDocument,
  label: string,
  amount: string,
  bold = false,
) {
  const labelWidth = 320;
  const amountX = 380;
  const amountWidth = 165;
  const startY = pdf.y;
  pdf.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10);
  const labelHeight = pdf.heightOfString(label, { width: labelWidth });
  pdf.text(label, 50, startY, { width: labelWidth });
  pdf.text(amount, amountX, startY, { width: amountWidth, align: "right" });
  pdf.x = 50;
  pdf.y = startY + Math.max(labelHeight, 14);
}

export interface PayslipPdfData {
  company: { name: string; currency: string; logoUrl?: string | null };
  employee: {
    code: string;
    fullName: string;
    position: string;
    department: string;
    contractType: string;
    city: string | null;
    hireDate: Date;
  };
  period: Date;
  hours: {
    contractualHours: number;
    actualHours: number;
    overtimeHours: number;
    overtimePay: number;
  };
  payroll: {
    grossSalary: number;
    bonus: number;
    latePenalty: number;
    socialContribution: number;
    overtimePay: number;
    totalGross: number;
    netSalary: number;
  };
  paymentStatus: string;
  paymentDate: Date | null;
}

/** Rendu PUR du bulletin de paie — aucun accès base de données (voir pdf.service.ts). */
export function renderPayslipPdf(
  pdf: PDFKit.PDFDocument,
  data: PayslipPdfData,
): void {
  const {
    company,
    employee,
    period,
    hours,
    payroll,
    paymentStatus,
    paymentDate,
  } = data;
  const currency = company.currency;
  const amt = (v: number) => formatAmount(v, currency);
  const periodLabel = `${MONTHS_FR[period.getMonth()]} ${period.getFullYear()}`;

  drawCompanyLogo(pdf, company.logoUrl, {
    x: 450,
    y: 40,
    maxWidth: 95,
    maxHeight: 45,
  });

  pdf.font("Helvetica-Bold").fontSize(18).text("BULLETIN DE PAIE");
  pdf
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#555")
    .text(`Période : ${periodLabel}`);
  pdf.fillColor("#000");
  pdf.moveDown(1.2);

  // Employeur / Salarié, côte à côte
  const infoTop = pdf.y;
  pdf.font("Helvetica-Bold").fontSize(11).text("Employeur", 50, infoTop);
  pdf
    .font("Helvetica")
    .fontSize(10)
    .text(company.name, 50, infoTop + 16, { width: 240 });

  pdf.font("Helvetica-Bold").fontSize(11).text("Salarié", 320, infoTop);
  pdf
    .font("Helvetica")
    .fontSize(10)
    .text(employee.fullName, 320, infoTop + 16, { width: 225 });
  let salarieY = pdf.y;
  pdf.text(`Matricule : ${employee.code}`, 320, salarieY, { width: 225 });
  salarieY = pdf.y;
  pdf.text(`${employee.position} — ${employee.department}`, 320, salarieY, {
    width: 225,
  });
  salarieY = pdf.y;
  pdf.text(`Contrat : ${employee.contractType}`, 320, salarieY, { width: 225 });
  salarieY = pdf.y;
  pdf.text(
    `Entrée en fonction : ${new Date(employee.hireDate).toLocaleDateString("fr-FR")}`,
    320,
    salarieY,
    { width: 225 },
  );
  salarieY = pdf.y;
  if (employee.city) {
    pdf.text(employee.city, 320, salarieY, { width: 225 });
    salarieY = pdf.y;
  }

  pdf.x = 50;
  pdf.y = salarieY + 14;
  pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).strokeColor("#ccc").stroke();
  pdf.moveDown(0.6);

  // Heures travaillées
  pdf.font("Helvetica-Bold").fontSize(11).text("Temps de travail");
  pdf.moveDown(0.2);
  labelAmountRow(pdf, "Heures contractuelles", `${hours.contractualHours} h`);
  labelAmountRow(pdf, "Heures effectuées", `${hours.actualHours} h`);
  if (hours.overtimeHours > 0) {
    labelAmountRow(
      pdf,
      "Heures supplémentaires (majoration 25%)",
      `${hours.overtimeHours} h — ${amt(hours.overtimePay)}`,
    );
  }

  pdf.moveDown(0.8);
  pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).strokeColor("#ccc").stroke();
  pdf.moveDown(0.6);

  // Décompte de la paie
  pdf.font("Helvetica-Bold").fontSize(11).text("Décompte de la rémunération");
  pdf.moveDown(0.2);
  labelAmountRow(pdf, "Salaire de base", amt(payroll.grossSalary));
  if (payroll.overtimePay > 0)
    labelAmountRow(pdf, "Heures supplémentaires", amt(payroll.overtimePay));
  if (payroll.bonus > 0) labelAmountRow(pdf, "Prime", amt(payroll.bonus));
  labelAmountRow(pdf, "Salaire brut total", amt(payroll.totalGross), true);
  pdf.moveDown(0.3);
  if (payroll.latePenalty > 0)
    labelAmountRow(pdf, "Retenue pour retard", `- ${amt(payroll.latePenalty)}`);
  labelAmountRow(
    pdf,
    "Cotisation sociale salarié",
    `- ${amt(payroll.socialContribution)}`,
  );

  pdf.moveDown(0.5);
  pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).strokeColor("#000").stroke();
  pdf.moveDown(0.4);
  labelAmountRow(pdf, "NET À PAYER", amt(payroll.netSalary), true);

  pdf.moveDown(1);
  pdf.font("Helvetica").fontSize(9).fillColor("#555");
  pdf.text(
    `Statut du paiement : ${paymentStatus}${paymentDate ? ` — versé le ${new Date(paymentDate).toLocaleDateString("fr-FR")}` : ""}`,
  );
  pdf.fillColor("#000");

  pdf.moveDown(2);
  pdf
    .font("Helvetica-Oblique")
    .fontSize(8)
    .fillColor("#999")
    .text(
      "Ce bulletin est établi à titre indicatif par l'outil de gestion FINAKOM et ne se substitue pas à un bulletin de paie réglementaire dûment validé par un gestionnaire de paie agréé.",
      { width: 495 },
    );
}

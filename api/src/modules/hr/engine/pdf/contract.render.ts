import {
  formatAmountForPdf as formatAmount,
  sanitizeForPdf as clean,
} from "@/utils/pdfText";
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

function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function paragraph(pdf: PDFKit.PDFDocument, text: string) {
  pdf
    .font("Helvetica")
    .fontSize(10)
    .text(clean(text), { align: "justify", width: 495 });
  pdf.moveDown(0.6);
}

function article(pdf: PDFKit.PDFDocument, number: number, title: string) {
  pdf.moveDown(0.3);
  pdf.font("Helvetica-Bold").fontSize(11).text(`Article ${number} — ${title}`);
  pdf.moveDown(0.2);
}

export interface ContractPdfData {
  company: {
    name: string;
    currency: string;
    logoUrl?: string | null;
    country: string;
    sector: string | null;
  };
  employee: {
    code: string;
    fullName: string;
    gender: "M" | "F";
    position: string;
    department: string;
    employmentType: string;
    contractType: string;
    grossSalary: number;
    hireDate: Date;
    city: string | null;
    workLocation: string | null;
    weeklyHours: number | null;
    trialPeriodMonths: number | null;
    contractEndDate: Date | null;
  };
}

/**
 * Rendu PUR du contrat de travail — aucun accès base de données. Trame
 * générique conforme à l'esprit du droit du travail OHADA (identification des
 * parties, objet, durée, rémunération, lieu, horaires, période d'essai,
 * clauses de rupture), pensée comme un DOCUMENT DE TRAVAIL prêt à imprimer et
 * signer — pas comme un avis juridique certifié. Un bandeau de mise en garde
 * explicite figure en fin de document (voir plus bas) : à faire relire par un
 * professionnel du droit du travail avant signature, exactement comme pour le
 * bulletin de paie généré par ailleurs dans l'application.
 */
export function renderContractPdf(
  pdf: PDFKit.PDFDocument,
  data: ContractPdfData,
): void {
  const { company, employee } = data;
  const amt = (v: number) => formatAmount(v, company.currency);
  const civilite = employee.gender === "F" ? "Madame" : "Monsieur";
  const isCDD = employee.contractType.toUpperCase().includes("CDD");

  drawCompanyLogo(pdf, company.logoUrl, {
    x: 450,
    y: 40,
    maxWidth: 95,
    maxHeight: 45,
  });

  pdf.font("Helvetica-Bold").fontSize(18).text("CONTRAT DE TRAVAIL");
  pdf
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#555")
    .text(`${employee.contractType} — ${employee.employmentType}`);
  pdf.fillColor("#000");
  pdf.moveDown(1);

  paragraph(pdf, `Entre les soussignés :`);

  pdf
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(clean(company.name), { continued: false });
  pdf
    .font("Helvetica")
    .fontSize(10)
    .text(
      clean(
        `Entreprise${company.sector ? ` — ${company.sector}` : ""}, ${company.country}.`,
      ),
    );
  pdf.text("Ci-après dénommé « l'Employeur »,");
  pdf.moveDown(0.5);

  pdf.font("Helvetica-Bold").fontSize(10).text("ET");
  pdf.moveDown(0.3);
  pdf
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(clean(`${civilite} ${employee.fullName}`));
  pdf
    .font("Helvetica")
    .fontSize(10)
    .text(
      clean(
        `Matricule : ${employee.code}${employee.city ? ` — Domicilié(e) à ${employee.city}` : ""}.`,
      ),
    );
  pdf.text("Ci-après dénommé(e) « le/la Salarié(e) »,");
  pdf.moveDown(1);

  paragraph(pdf, "Il a été convenu et arrêté ce qui suit :");

  article(pdf, 1, "Engagement");
  paragraph(
    pdf,
    `L'Employeur engage ${civilite} ${employee.fullName} en qualité de ${employee.position}, au sein du service ${employee.department}, à compter du ${formatDate(employee.hireDate)}.`,
  );

  article(pdf, 2, "Nature du contrat");
  if (isCDD && employee.contractEndDate) {
    paragraph(
      pdf,
      `Le présent contrat est conclu à durée déterminée (CDD), pour la période du ${formatDate(employee.hireDate)} au ${formatDate(employee.contractEndDate)}, conformément aux dispositions légales applicables aux contrats à durée déterminée.`,
    );
  } else if (isCDD) {
    paragraph(
      pdf,
      `Le présent contrat est conclu à durée déterminée (CDD). [Date de fin à préciser — non renseignée dans la fiche du salarié.]`,
    );
  } else {
    paragraph(
      pdf,
      `Le présent contrat est conclu à durée indéterminée (CDI), à compter du ${formatDate(employee.hireDate)}.`,
    );
  }

  if (employee.trialPeriodMonths !== null && employee.trialPeriodMonths > 0) {
    article(pdf, 3, "Période d'essai");
    paragraph(
      pdf,
      `Le présent contrat est conclu sous réserve d'une période d'essai de ${employee.trialPeriodMonths} mois, durant laquelle chacune des parties pourra librement y mettre fin, dans le respect des délais de prévenance prévus par la réglementation applicable.`,
    );
  }

  article(pdf, employee.trialPeriodMonths ? 4 : 3, "Lieu de travail");
  paragraph(
    pdf,
    employee.workLocation
      ? `Le/la salarié(e) exercera ses fonctions à : ${employee.workLocation}. L'Employeur se réserve la possibilité de modifier ce lieu selon les nécessités du service, dans un périmètre raisonnable.`
      : `[Lieu de travail à préciser — non renseigné dans la fiche du salarié.]`,
  );

  article(pdf, employee.trialPeriodMonths ? 5 : 4, "Durée du travail");
  paragraph(
    pdf,
    employee.weeklyHours
      ? `La durée hebdomadaire de travail est fixée à ${employee.weeklyHours} heures, répartie selon l'horaire en vigueur au sein de l'entreprise et conforme à la réglementation applicable.`
      : `[Durée hebdomadaire de travail à préciser — non renseignée dans la fiche du salarié.]`,
  );

  article(pdf, employee.trialPeriodMonths ? 6 : 5, "Rémunération");
  paragraph(
    pdf,
    `En contrepartie de son travail, le/la salarié(e) percevra une rémunération mensuelle brute de ${amt(employee.grossSalary)}, versée mensuellement, sous réserve des retenues sociales et fiscales applicables.`,
  );

  article(pdf, employee.trialPeriodMonths ? 7 : 6, "Obligations des parties");
  paragraph(
    pdf,
    `Le/la salarié(e) s'engage à exécuter les tâches qui lui sont confiées avec diligence et loyauté, et à respecter le règlement intérieur ainsi que les directives de l'Employeur. L'Employeur s'engage à fournir au/à la salarié(e) les moyens nécessaires à l'exécution de sa mission et à respecter les obligations légales et conventionnelles applicables.`,
  );

  article(pdf, employee.trialPeriodMonths ? 8 : 7, "Rupture du contrat");
  paragraph(
    pdf,
    isCDD
      ? `Le présent contrat prendra fin de plein droit à son terme. Toute rupture anticipée devra respecter les conditions prévues par la réglementation applicable aux contrats à durée déterminée.`
      : `Le présent contrat pourra être rompu par l'une ou l'autre des parties, dans le respect des dispositions légales et conventionnelles applicables, notamment en matière de préavis et de motif de rupture.`,
  );

  pdf.moveDown(1.5);
  paragraph(
    pdf,
    `Fait à ${employee.workLocation ?? data.company.country}, en deux exemplaires, le ${formatDate(new Date())}.`,
  );

  pdf.moveDown(1);
  const signY = pdf.y;
  pdf
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Pour l'Employeur", 50, signY, { width: 220 });
  pdf
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Le/la Salarié(e)", 320, signY, { width: 220 });
  pdf
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#999")
    .text(
      "(signature précédée de la mention « lu et approuvé »)",
      50,
      signY + 16,
      { width: 220 },
    );
  pdf.text(
    "(signature précédée de la mention « lu et approuvé »)",
    320,
    signY + 16,
    { width: 220 },
  );
  pdf.fillColor("#000");
  pdf.x = 50;
  pdf.y = signY + 60;

  pdf.moveDown(1);
  pdf
    .font("Helvetica-Oblique")
    .fontSize(8)
    .fillColor("#777")
    .text(
      "Ce contrat est établi à titre de modèle de travail par l'outil de gestion FINAKOM, à partir des informations renseignées pour ce salarié. " +
        "Il ne se substitue pas à une relecture par un professionnel du droit du travail : vérifiez notamment les durées de préavis, la période d'essai " +
        "et toute clause spécifique conforme à la réglementation en vigueur avant signature.",
      { width: 495 },
    );
  pdf.fillColor("#000");
}

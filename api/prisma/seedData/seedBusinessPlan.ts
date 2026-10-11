/**
 * Module Business Plan — pas systématique pour toutes les entreprises
 * (cohérent avec la réalité : une PME ne monte pas nécessairement un dossier
 * de financement), seulement pour celles dont `withBusinessPlan` est vrai.
 * Couvre les 6 sous-modèles : investissement, financement, fournisseurs,
 * compte de résultat sur l'horizon, trésorerie mensuelle année 1, bilan.
 */
import { PrismaClient } from "@prisma/client";
import { SeededCompany } from "./seedFoundation";

export async function seedBusinessPlan(
  prisma: PrismaClient,
  company: SeededCompany,
) {
  const s = (n: number) => Math.round(n * company.scale);

  const plan = await prisma.businessPlan.create({
    data: {
      companyId: company.id,
      title: `Plan de développement 2026-2028 — ${company.name}`,
      status: "Finalisé",
      horizonYears: 3,
      createdById: company.creatorUserId,
      narrativeSections: {
        presentation: `${company.name} est une entreprise comorienne établie, spécialisée dans son secteur d'activité, qui souhaite structurer sa croissance sur les trois prochaines années.`,
        executiveSummary:
          "Le projet vise à renforcer les capacités opérationnelles et à diversifier l'offre commerciale.",
        marketStudy:
          "Le marché local présente une demande croissante, portée par le développement économique de l'archipel.",
        swot: "Forces : implantation locale, réseau de clients fidèles. Faiblesses : accès limité au financement. Opportunités : croissance du secteur. Menaces : concurrence de l'import direct.",
        strategy:
          "Consolidation de la clientèle existante et prospection de nouveaux segments sur les trois prochaines années.",
      },
    },
  });

  await prisma.businessPlanInvestment.createMany({
    data: [
      {
        businessPlanId: plan.id,
        category: "Matériel et équipement",
        description: "Acquisition de matériel professionnel",
        amount: s(8000000),
      },
      {
        businessPlanId: plan.id,
        category: "Aménagement",
        description: "Travaux de réaménagement des locaux",
        amount: s(3500000),
      },
      {
        businessPlanId: plan.id,
        category: "Fonds de roulement",
        description: "Constitution du stock de démarrage",
        amount: s(2500000),
      },
    ],
  });

  await prisma.businessPlanFunding.createMany({
    data: [
      {
        businessPlanId: plan.id,
        type: "Apport personnel",
        detail: "Apport de l'exploitant",
        amount: s(5000000),
      },
      {
        businessPlanId: plan.id,
        type: "Emprunt bancaire",
        detail: "Prêt professionnel sur 5 ans",
        amount: s(7000000),
      },
      {
        businessPlanId: plan.id,
        type: "Subvention",
        detail: "Aide au développement local",
        amount: s(2000000),
      },
    ],
  });

  await prisma.businessPlanSupplier.createMany({
    data: [
      {
        businessPlanId: plan.id,
        name: "Fournisseur principal Océan Indien",
        supplyType: "Approvisionnement marchandises",
        annualAmount: s(12000000),
      },
      {
        businessPlanId: plan.id,
        name: "Prestataire logistique local",
        supplyType: "Transport & livraison",
        annualAmount: s(1800000),
      },
    ],
  });

  // ---- Compte de résultat prévisionnel (3 ans, quelques rubriques par année) ----
  const plSections: {
    section: string;
    label: string;
    year1: number;
    growth: number;
  }[] = [
    {
      section: "ChiffreAffaires",
      label: "Ventes de marchandises",
      year1: 28000000,
      growth: 1.15,
    },
    {
      section: "ChargesVariables",
      label: "Achats de marchandises",
      year1: 16000000,
      growth: 1.12,
    },
    {
      section: "ChargesFixes",
      label: "Loyers et charges locatives",
      year1: 4200000,
      growth: 1.03,
    },
    {
      section: "ChargesPersonnel",
      label: "Salaires et charges sociales",
      year1: 5400000,
      growth: 1.08,
    },
    {
      section: "ChargesFinancieres",
      label: "Intérêts emprunt",
      year1: 700000,
      growth: 0.9,
    },
    {
      section: "ImpotSocietes",
      label: "Impôt sur les sociétés",
      year1: 450000,
      growth: 1.1,
    },
  ];
  const plData = [];
  for (const spec of plSections) {
    for (let year = 1; year <= plan.horizonYears; year++) {
      plData.push({
        businessPlanId: plan.id,
        year,
        section: spec.section,
        label: spec.label,
        amount: s(Math.round(spec.year1 * spec.growth ** (year - 1))),
      });
    }
  }
  await prisma.businessPlanPLLine.createMany({ data: plData });

  // ---- Plan de trésorerie mensuel — année 1 uniquement (comme le classeur source) ----
  const cashflowData = [];
  for (let month = 1; month <= 12; month++) {
    cashflowData.push({
      businessPlanId: plan.id,
      month,
      type: "Encaissement",
      category: "Ventes",
      label: "Encaissements clients",
      amount: s(2300000 + month * 20000),
    });
    cashflowData.push({
      businessPlanId: plan.id,
      month,
      type: "Décaissement",
      category: "Achats",
      label: "Règlements fournisseurs",
      amount: s(1350000 + month * 10000),
    });
    cashflowData.push({
      businessPlanId: plan.id,
      month,
      type: "Décaissement",
      category: "Personnel",
      label: "Salaires",
      amount: s(450000),
    });
  }
  await prisma.businessPlanCashflowLine.createMany({ data: cashflowData });

  // ---- Bilan prévisionnel (3 ans, actif et passif) ----
  const balanceData = [];
  for (let year = 1; year <= plan.horizonYears; year++) {
    const growth = 1.1 ** (year - 1);
    balanceData.push(
      {
        businessPlanId: plan.id,
        year,
        side: "Actif",
        category: "Immobilisations corporelles",
        amount: s(Math.round(9500000 * growth)),
      },
      {
        businessPlanId: plan.id,
        year,
        side: "Actif",
        category: "Stocks",
        amount: s(Math.round(2200000 * growth)),
      },
      {
        businessPlanId: plan.id,
        year,
        side: "Actif",
        category: "Créances clients",
        amount: s(Math.round(1800000 * growth)),
      },
      {
        businessPlanId: plan.id,
        year,
        side: "Passif",
        category: "Apport personnel",
        amount: s(5000000),
      },
      {
        businessPlanId: plan.id,
        year,
        side: "Passif",
        category: "Emprunts",
        amount: s(Math.round(7000000 * (1 - 0.15 * (year - 1)))),
      },
      {
        businessPlanId: plan.id,
        year,
        side: "Passif",
        category: "Dettes fournisseurs",
        amount: s(Math.round(1400000 * growth)),
      },
    );
  }
  await prisma.businessPlanBalanceLine.createMany({ data: balanceData });
}

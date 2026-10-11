/**
 * Module Trésorerie : paramètres, mouvements réels répartis sur plusieurs
 * mois (pour tester dashboard/graphiques), budget prévisionnel de trésorerie
 * ET du compte de résultat (même principe répliqué), et quelques lignes de
 * relevé bancaire pour le rapprochement (une déjà rapprochée, une en attente).
 */
import { PrismaClient } from "@prisma/client";
import { SeededCompany } from "./seedFoundation";

export async function seedTreasury(
  prisma: PrismaClient,
  company: SeededCompany,
) {
  await prisma.treasurySettings.create({
    data: {
      companyId: company.id,
      openingCashBalance: Math.round(500000 * company.scale),
      openingBankBalance: Math.round(3500000 * company.scale),
      alertThreshold: Math.round(1000000 * company.scale),
      criticalThreshold: Math.round(300000 * company.scale),
      avgCollectionDays: 30,
      avgPaymentDays: 45,
    },
  });

  const s = (n: number) => Math.round(n * company.scale);
  const treasuryLines: {
    date: Date;
    label: string;
    category: string;
    type: "Encaissement" | "Décaissement";
    amount: number;
    support: string;
    paymentMethod: string;
  }[] = [
    {
      date: new Date("2026-01-05"),
      label: "Règlement client",
      category: "Règlements clients",
      type: "Encaissement",
      amount: s(3588750),
      support: "Banque",
      paymentMethod: "Virement",
    },
    {
      date: new Date("2026-01-08"),
      label: "Achat marchandises fournisseur",
      category: "Achats fournisseurs",
      type: "Décaissement",
      amount: s(2392500),
      support: "Banque",
      paymentMethod: "Virement",
    },
    {
      date: new Date("2026-01-15"),
      label: "Salaires nets janvier",
      category: "Salaires & charges sociales",
      type: "Décaissement",
      amount: s(714300),
      support: "Banque",
      paymentMethod: "Virement",
    },
    {
      date: new Date("2026-01-20"),
      label: "Vente comptant",
      category: "Ventes comptant",
      type: "Encaissement",
      amount: s(485625),
      support: "Caisse",
      paymentMethod: "Espèces",
    },
    {
      date: new Date("2026-01-25"),
      label: "Frais bancaires janvier",
      category: "Frais généraux",
      type: "Décaissement",
      amount: s(15000),
      support: "Banque",
      paymentMethod: "Prélèvement auto",
    },
    {
      date: new Date("2026-01-31"),
      label: "TVA nette versée DGI",
      category: "TVA versée DGI",
      type: "Décaissement",
      amount: s(192500),
      support: "Banque",
      paymentMethod: "Virement",
    },
    {
      date: new Date("2026-02-10"),
      label: "Vente comptant mobile money",
      category: "Ventes comptant",
      type: "Encaissement",
      amount: s(210000),
      support: "Orange Money",
      paymentMethod: "Mobile Money",
    },
    {
      date: new Date("2026-02-15"),
      label: "Loyer local commercial février",
      category: "Loyers & charges locatives",
      type: "Décaissement",
      amount: s(350000),
      support: "Banque",
      paymentMethod: "Virement",
    },
    {
      date: new Date("2026-02-20"),
      label: "Règlement client",
      category: "Règlements clients",
      type: "Encaissement",
      amount: s(1250000),
      support: "Banque",
      paymentMethod: "Virement",
    },
    {
      date: new Date("2026-02-28"),
      label: "Salaires nets février",
      category: "Salaires & charges sociales",
      type: "Décaissement",
      amount: s(714300),
      support: "Banque",
      paymentMethod: "Virement",
    },
    {
      date: new Date("2026-03-05"),
      label: "Vente comptant",
      category: "Ventes comptant",
      type: "Encaissement",
      amount: s(620000),
      support: "Caisse",
      paymentMethod: "Espèces",
    },
    {
      date: new Date("2026-03-12"),
      label: "Achat fournitures",
      category: "Achats fournisseurs",
      type: "Décaissement",
      amount: s(180000),
      support: "Banque",
      paymentMethod: "Virement",
    },
  ];
  const createdEntries = [];
  for (const line of treasuryLines) {
    const entry = await prisma.treasuryEntry.create({
      data: {
        ...line,
        companyId: company.id,
        status: "Réalisé",
        createdById: company.creatorUserId,
      },
    });
    createdEntries.push(entry);
  }

  // ---- Budget prévisionnel de trésorerie (12 mois, quelques rubriques) ----
  const treasuryBudgetSpecs: {
    rubric: string;
    type: "Encaissement" | "Décaissement";
    monthlyAmount: number;
  }[] = [
    { rubric: "Ventes comptant", type: "Encaissement", monthlyAmount: 3000000 },
    {
      rubric: "Règlements clients",
      type: "Encaissement",
      monthlyAmount: 1500000,
    },
    {
      rubric: "Achats fournisseurs",
      type: "Décaissement",
      monthlyAmount: 2000000,
    },
    {
      rubric: "Salaires & charges sociales",
      type: "Décaissement",
      monthlyAmount: 1020000,
    },
    {
      rubric: "Loyers & charges locatives",
      type: "Décaissement",
      monthlyAmount: 350000,
    },
  ];
  for (const spec of treasuryBudgetSpecs) {
    for (let month = 1; month <= 12; month++) {
      await prisma.treasuryBudgetLine.create({
        data: {
          companyId: company.id,
          fiscalYear: 2026,
          rubric: spec.rubric,
          type: spec.type,
          month,
          amount: s(spec.monthlyAmount),
        },
      });
    }
  }

  // ---- Budget prévisionnel du compte de résultat (12 mois, Produit/Charge) ----
  const incomeBudgetSpecs: {
    type: "Produit" | "Charge";
    monthlyAmount: number;
  }[] = [
    { type: "Produit", monthlyAmount: 4500000 },
    { type: "Charge", monthlyAmount: 3200000 },
  ];
  for (const spec of incomeBudgetSpecs) {
    for (let month = 1; month <= 12; month++) {
      await prisma.incomeBudgetLine.create({
        data: {
          companyId: company.id,
          fiscalYear: 2026,
          type: spec.type,
          month,
          amount: s(spec.monthlyAmount),
        },
      });
    }
  }

  // ---- Rapprochement bancaire : une ligne déjà rapprochée, une en attente ----
  await prisma.bankStatementLine.create({
    data: {
      companyId: company.id,
      date: new Date("2026-01-05"),
      label: "VIR RECU CLIENT",
      amount: s(3588750),
      reference: "REL-2026-01",
      importBatch: "IMPORT-2026-01",
      matchedEntryId: createdEntries[0].id,
    },
  });
  await prisma.bankStatementLine.create({
    data: {
      companyId: company.id,
      date: new Date("2026-01-08"),
      label: "VIR EMIS FOURNISSEUR",
      amount: -s(2392500),
      reference: "REL-2026-02",
      importBatch: "IMPORT-2026-01",
    },
  });
  await prisma.bankStatementLine.create({
    data: {
      companyId: company.id,
      date: new Date("2026-02-01"),
      label: "FRAIS TENUE COMPTE",
      amount: -s(8500),
      reference: "REL-2026-03",
      importBatch: "IMPORT-2026-02",
    },
  });
}

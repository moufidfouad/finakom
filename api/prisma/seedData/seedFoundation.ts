/**
 * Fondation : utilisateurs, entreprises, plan comptable — tout le reste du
 * seed dépend de ces données. Idempotent : upsert sur les utilisateurs (clé
 * unique sur l'email), et une entreprise n'est créée que si elle n'existe pas
 * déjà pour cet utilisateur — pour que le script puisse être relancé sans
 * planter sur une seconde exécution (contrairement à la version précédente,
 * qui utilisait `create` sans garde et échouait dès le deuxième passage).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { STANDARD_CHART_OF_ACCOUNTS } from "../../src/modules/accounting/chartOfAccounts/chartOfAccounts.seedData";
import { USERS } from "./referenceData";

export const SEED_PASSWORD = "Password123!";

export interface SeededCompany {
  id: string;
  name: string;
  scale: number;
  creatorUserId: string;
  companyIndex: number;
  isNew: boolean; // false si l'entreprise existait déjà — les modules suivants doivent alors passer leur tour, pour que le script reste idempotent sans dupliquer clients/documents/etc. à chaque relance
}

export async function seedFoundation(
  prisma: PrismaClient,
): Promise<{ companies: SeededCompany[]; memberUserId: string }> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  const companies: SeededCompany[] = [];
  let companyCounter = 0;

  for (const userSpec of USERS) {
    const user = await prisma.user.upsert({
      where: { email: userSpec.email },
      update: {},
      create: {
        email: userSpec.email,
        passwordHash,
        fullName: userSpec.fullName,
        role: userSpec.role,
        emailVerified: true,
        authProvider: "local",
      },
    });
    console.log(`👤 ${userSpec.role.padEnd(10)} ${user.email}`);

    for (const companySpec of userSpec.companies) {
      // Idempotence : une entreprise du même nom pour ce créateur n'est pas recréée.
      let company = await prisma.company.findFirst({
        where: { userId: user.id, name: companySpec.name },
      });
      const isNew = !company;
      company ??= await prisma.company.create({
        data: {
          userId: user.id,
          name: companySpec.name,
          country: companySpec.country,
          currency: companySpec.currency,
          sector: companySpec.sector,
          address: companySpec.address,
          directoryVisibility: companySpec.directoryVisibility ?? "Brouillon",
          publicDescription: companySpec.publicDescription,
          accountingSystem: companySpec.accountingSystem,
          fiscalRegime: companySpec.fiscalRegime,
        },
      });

      if (isNew) {
        await prisma.companyMember.create({
          data: { companyId: company.id, userId: user.id, role: "ADMIN" },
        });
        await prisma.invoicingSettings.create({
          data: {
            companyId: company.id,
            tvaRatePercent: 18,
            quoteValidityDays: 30,
            paymentTermsDays: 30,
          },
        });

        // Plan comptable SYSCOHADA standard — condition de toute contre-passation
        // automatique ultérieure (ventes, achats, paie, amortissements).
        for (const account of STANDARD_CHART_OF_ACCOUNTS) {
          await prisma.chartOfAccount.create({
            data: {
              companyId: company.id,
              accountNumber: account.accountNumber,
              label: account.label,
              classe: account.accountNumber.charAt(0),
              role: account.role as never,
            },
          });
        }
      }

      console.log(
        `   🏢 ${company.name}${isNew ? "" : " (déjà existante — données non recréées)"}`,
      );
      companies.push({
        id: company.id,
        name: company.name,
        scale: companySpec.scale,
        creatorUserId: user.id,
        companyIndex: companyCounter,
        isNew,
      });
      companyCounter += 1;
    }
  }

  // Utilisateur "membre" de démonstration, rattaché (non-admin) à la première
  // entreprise créée.
  const member = await prisma.user.upsert({
    where: { email: "commercial@finakom.app" },
    update: {},
    create: {
      email: "commercial@finakom.app",
      passwordHash,
      fullName: "Youssouf Bacar",
      role: "USER",
      emailVerified: true,
      authProvider: "local",
    },
  });
  if (companies.length > 0) {
    await prisma.companyMember.upsert({
      where: {
        companyId_userId: { companyId: companies[0].id, userId: member.id },
      },
      update: {},
      create: { companyId: companies[0].id, userId: member.id, role: "MEMBER" },
    });
  }
  console.log(
    `👤 MEMBER     ${member.email} (rattaché à ${companies[0]?.name ?? "—"}, rôle MEMBER)`,
  );

  return { companies, memberUserId: member.id };
}

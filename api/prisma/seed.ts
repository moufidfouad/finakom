/**
 * Point d'entrée du seed — orchestre les modules dédiés sous prisma/seedData/
 * dans l'ordre de dépendance réel du schéma. Idempotent : relancer le script
 * ne recrée jamais les données d'une entreprise déjà existante (voir
 * seedFoundation.ts::isNew).
 *
 * Usage : npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { seedFoundation } from "./seedData/seedFoundation";
import { buildAccountRoleMap } from "./seedData/postingHelpers";
import { seedInvoicing } from "./seedData/seedInvoicing";
import { seedPurchasing } from "./seedData/seedPurchasing";
import { seedTreasury } from "./seedData/seedTreasury";
import { seedFixedAssets } from "./seedData/seedFixedAssets";
import { seedHr } from "./seedData/seedHr";
import { seedBusinessPlan } from "./seedData/seedBusinessPlan";
import {
  seedFinanceAnalysis,
  seedAuditLog,
  seedFiscalYearClosing,
} from "./seedData/seedAnalysisAuditClosing";
import { seedContactMessages } from "./seedData/seedContactMessages";
import { seedCandidates } from "./seedData/seedCandidates";
import { seedJobPostings } from "./seedData/seedJobPostings";
import { seedFiscalite } from "./seedData/seedFiscalite";
import { SEED_PASSWORD } from "./seedData/seedFoundation";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du seed FINAKOM…\n");

  const { companies } = await seedFoundation(prisma);

  // Modèle global, sans lien à une entreprise — peuplé une seule fois, jamais
  // par entreprise. Pas de contrainte d'unicité naturelle sur ce modèle, donc
  // idempotence assurée manuellement : on ne recrée rien si la table n'est pas vide.
  if ((await prisma.contactMessage.count()) === 0) {
    await seedContactMessages(prisma);
    console.log("✉️  Messages de contact de démonstration créés");
  }

  // Modèle global lui aussi (Candidate n'a pas de lien à une entreprise) —
  // idempotence gérée en interne par email (upsert implicite via findUnique + skip).
  const candidateResult = await seedCandidates(prisma);
  if (candidateResult.createdCount > 0) {
    console.log(
      `🎓 ${candidateResult.createdCount} candidat(s) créé(s), ${candidateResult.cvCount} CV créé(s)`,
    );
  }

  const counters = {
    clients: 0,
    products: 0,
    suppliers: 0,
    employees: 0,
    jobPostings: 0,
  };

  for (const company of companies) {
    if (!company.isNew) continue; // idempotence : entreprise déjà seedée, on ne recrée rien

    // Le plan comptable doit exister avant toute contre-passation — déjà créé
    // par seedFoundation, on résout ici la table rôle -> compte une seule fois.
    const roleMap = await buildAccountRoleMap(prisma, company.id);

    const { products } = await seedInvoicing(prisma, company, roleMap);
    const { suppliers } = await seedPurchasing(
      prisma,
      company,
      roleMap,
      products,
    );
    await seedTreasury(prisma, company);
    await seedFixedAssets(prisma, company);
    const { employees } = await seedHr(prisma, company);
    await seedFinanceAnalysis(prisma, company);
    await seedFiscalite(prisma, company);

    // Business plan et clôture d'exercice réservés à un sous-ensemble
    // d'entreprises — cohérent avec la réalité (toutes les PME ne montent pas
    // un dossier de financement, et clôturer bloquerait la démonstration si
    // appliqué partout).
    if (company.companyIndex % 2 === 0) {
      await seedBusinessPlan(prisma, company);
    }
    if (company.companyIndex === 0) {
      await seedFiscalYearClosing(prisma, company, roleMap);
    }

    await seedAuditLog(prisma, company, "FAC-2026-001");
    const jobPostingCount = await seedJobPostings(
      prisma,
      company,
      company.creatorUserId,
    );

    counters.clients += 10;
    counters.products += products.length;
    counters.suppliers += suppliers.length;
    counters.employees += employees.length;
    counters.jobPostings += jobPostingCount;
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Seed terminé avec succès");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(
    `Entreprises traitées : ${companies.filter((c) => c.isNew).length} / ${companies.length}`,
  );
  console.log(`Clients créés        : ${counters.clients}`);
  console.log(`Produits créés       : ${counters.products}`);
  console.log(`Fournisseurs créés   : ${counters.suppliers}`);
  console.log(`Employés créés       : ${counters.employees}`);
  console.log(`Offres d'emploi créées : ${counters.jobPostings}`);
  console.log(
    `Candidats créés       : ${candidateResult.createdCount} (${candidateResult.cvCount} CV)`,
  );
  console.log(`\nMot de passe commun à tous les comptes : ${SEED_PASSWORD}\n`);
}

main()
  .catch((err) => {
    console.error("❌ Erreur pendant le seed :", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

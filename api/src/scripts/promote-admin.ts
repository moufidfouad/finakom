/**
 * Usage : npx tsx scripts/promote-admin.ts email@exemple.com
 */
import { prisma } from "@/config/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage : npx tsx scripts/promote-admin.ts email@exemple.com");
    process.exit(1);
  }
  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });
  console.log(`✅ ${user.email} est désormais administrateur.`);
}

main()
  .catch((err) => {
    console.error("Erreur :", err.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

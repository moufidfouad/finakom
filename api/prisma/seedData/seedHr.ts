/**
 * Module RH complet : employés (avec organigramme via managerId), présences,
 * retards, heures travaillées, bulletins de paie, demandes de congé et un
 * avenant au contrat — chaque sous-modèle avec des statuts variés plutôt
 * qu'un seul état "terminé" répété.
 */
import { PrismaClient } from "@prisma/client";
import { EMPLOYEE_POOL } from "./referenceData";
import { SeededCompany } from "./seedFoundation";

export async function seedHr(prisma: PrismaClient, company: SeededCompany) {
  const employees: Awaited<ReturnType<typeof prisma.employee.create>>[] = [];
  for (let i = 0; i < EMPLOYEE_POOL.length; i++) {
    const base = EMPLOYEE_POOL[i];
    // Les 3 premiers employés créés (RH, Comptable, Commercial) n'ont pas de
    // manager ; les suivants dépendent de l'un d'eux — organigramme simple à 2 niveaux.
    const managerId = i >= 3 ? employees[i % 3].id : null;
    const employee = await prisma.employee.create({
      data: {
        companyId: company.id,
        code: `EMP-${String(i + 1).padStart(3, "0")}`,
        fullName: base.fullName,
        position: base.position,
        department: base.department,
        employmentType: "Temps plein",
        grossSalary: Math.round((250000 + i * 45000) * company.scale),
        hireDate: new Date(`202${2 + (i % 3)}-0${1 + (i % 9)}-01`),
        contractType: base.contractType,
        gender: base.gender,
        status: i === EMPLOYEE_POOL.length - 1 ? "Démissionné" : "Actif", // un employé sorti, pour tester ce statut
        managerId,
        workLocation: "Moroni",
        weeklyHours: 40,
        trialPeriodMonths: base.contractType === "CDI" ? 3 : null,
        contractEndDate:
          base.contractType === "CDD" ? new Date("2026-12-31") : null,
      },
    });
    employees.push(employee);
  }

  const activeEmployees = employees.filter((e) => e.status === "Actif");

  // ---- Référentiel de postes types (indépendant des fiches employé) ----
  const jobPositionSpecs = [
    {
      code: "POS-001",
      title: "Comptable",
      department: "Finance",
      category: "Cadre",
      salaryMin: 280000,
      salaryMax: 420000,
      mainTasks:
        "Tenue de la comptabilité, déclarations fiscales, suivi de trésorerie.",
    },
    {
      code: "POS-002",
      title: "Commercial terrain",
      department: "Ventes",
      category: "Employé",
      salaryMin: 180000,
      salaryMax: 260000,
      mainTasks: "Prospection, suivi client, prise de commandes.",
    },
    {
      code: "POS-003",
      title: "Chef de dépôt",
      department: "Logistique",
      category: "Agent de maîtrise",
      salaryMin: 220000,
      salaryMax: 310000,
      mainTasks:
        "Gestion des stocks, réception et expédition des marchandises.",
    },
  ];
  for (const spec of jobPositionSpecs) {
    await prisma.jobPosition.create({
      data: {
        companyId: company.id,
        ...spec,
        salaryMin: Math.round(spec.salaryMin * company.scale),
        salaryMax: Math.round(spec.salaryMax * company.scale),
      },
    });
  }

  // ---- Présences : Présent, Absence justifiée, Absence injustifiée, Congé, Maladie ----
  const attendanceStatuses = [
    "Présent",
    "Absence justifiée",
    "Absence injustifiée",
    "Congé",
    "Maladie",
  ];
  for (const [i, employee] of activeEmployees.entries()) {
    for (let day = 0; day < 5; day++) {
      const status =
        day === 0
          ? attendanceStatuses[i % attendanceStatuses.length]
          : "Présent";
      await prisma.attendanceRecord.create({
        data: {
          employeeId: employee.id,
          date: new Date(`2026-02-${10 + day}`),
          status,
          daysPresent: status === "Présent" ? 1 : 0,
          daysWorkable: 1,
          reason: status.startsWith("Absence")
            ? "Motif communiqué à la RH"
            : null,
        },
      });
    }
  }

  // ---- Retards : Justifié, Non justifié, Toléré ----
  const latenessStatuses = ["Justifié", "Non justifié", "Toléré"];
  for (const [i, employee] of activeEmployees.slice(0, 4).entries()) {
    await prisma.latenessRecord.create({
      data: {
        employeeId: employee.id,
        date: new Date("2026-02-12"),
        scheduledTime: "08:00",
        arrivalTime: `08:${20 + i * 5}`,
        lateMinutes: 20 + i * 5,
        status: latenessStatuses[i % latenessStatuses.length],
        reason: i % 2 === 0 ? "Embouteillage" : null,
      },
    });
  }

  // ---- Heures travaillées (février), avec heures supplémentaires pour certains ----
  for (const [i, employee] of activeEmployees.entries()) {
    await prisma.workedHours.create({
      data: {
        employeeId: employee.id,
        periodDate: new Date("2026-02-01"),
        contractualHours: 173.33,
        actualHours: i % 3 === 0 ? 182 : 173.33,
      },
    });
  }

  // ---- Bulletins de paie : Payé et En attente ----
  for (const [i, employee] of activeEmployees.entries()) {
    const gross = Number(employee.grossSalary);
    const bonus = i % 3 === 0 ? Math.round(gross * 0.05) : 0; // prime d'heures sup pour ceux qui en ont fait
    const socialContribution = Math.round(gross * 0.06);
    await prisma.payroll.create({
      data: {
        employeeId: employee.id,
        periodDate: new Date("2026-02-01"),
        grossSalary: gross,
        bonus,
        latePenalty: 0,
        socialContribution,
        paymentStatus: i % 4 === 0 ? "En attente" : "Payé",
        paymentDate: i % 4 === 0 ? null : new Date("2026-03-05"),
      },
    });
  }

  // ---- Congés : Approuvé (type Congé annuel, compte dans le solde), En attente, Refusé ----
  const leaveSpecs = [
    { type: "Congé annuel", status: "Approuvé", days: 5 },
    { type: "Congé maladie", status: "Approuvé", days: 2 },
    { type: "Congé annuel", status: "En attente", days: 3 },
    { type: "Congé sans solde", status: "Refusé", days: 10 },
  ];
  for (const [i, spec] of leaveSpecs.entries()) {
    const employee = activeEmployees[i % activeEmployees.length];
    const start = new Date(`2026-0${2 + i}-10`);
    const end = new Date(start.getTime() + spec.days * 24 * 3600 * 1000);
    await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveType: spec.type,
        startDate: start,
        endDate: end,
        numberOfDays: spec.days,
        status: spec.status,
      },
    });
  }

  // ---- Avenant au contrat : une promotion avec changement de poste et de salaire ----
  if (activeEmployees.length > 1) {
    const promoted = activeEmployees[1];
    const newGrossSalary = Math.round(Number(promoted.grossSalary) * 1.15);
    await prisma.contractAmendment.create({
      data: {
        employeeId: promoted.id,
        effectiveDate: new Date("2026-03-01"),
        reason: "Promotion",
        previousPosition: promoted.position,
        newPosition: `${promoted.position} senior`,
        previousGrossSalary: promoted.grossSalary,
        newGrossSalary,
        createdById: company.creatorUserId,
      },
    });
    // L'avenant reflète un vrai changement — on met à jour la fiche employé en conséquence.
    await prisma.employee.update({
      where: { id: promoted.id },
      data: {
        position: `${promoted.position} senior`,
        grossSalary: newGrossSalary,
      },
    });
  }

  return { employees };
}

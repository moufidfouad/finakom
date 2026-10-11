/**
 * Moteur pur de l'organigramme — détection de cycle hiérarchique et
 * construction de l'arbre depuis une liste plate d'employés. Aucun accès base
 * de données ici (voir employees.service.ts). Une hiérarchie circulaire non
 * détectée casserait silencieusement tout calcul ultérieur qui parcourt la
 * chaîne de management (ex : notifications aux managers, validations en cascade).
 */

export interface EmployeeManagerLink {
  id: string;
  managerId: string | null;
}

/**
 * Vérifie qu'assigner `proposedManagerId` comme supérieur de `employeeId` ne
 * crée pas de cycle — un employé ne peut jamais devenir, directement ou
 * indirectement (via une chaîne de managers), son propre supérieur.
 */
export function wouldCreateCycle(
  employeeId: string,
  proposedManagerId: string | null,
  allLinks: EmployeeManagerLink[],
): boolean {
  if (!proposedManagerId) return false;
  if (proposedManagerId === employeeId) return true;

  const managerById = new Map(allLinks.map((l) => [l.id, l.managerId]));
  const visited = new Set<string>();
  let current: string | null = proposedManagerId;

  while (current) {
    if (current === employeeId) return true;
    if (visited.has(current)) break; // cycle préexistant ailleurs dans les données — on s'arrête pour ne pas boucler indéfiniment
    visited.add(current);
    current = managerById.get(current) ?? null;
  }
  return false;
}

export interface OrgChartEmployee {
  id: string;
  fullName: string;
  position: string;
  managerId: string | null;
}

export interface OrgNode extends OrgChartEmployee {
  directReports: OrgNode[];
}

/**
 * Construit l'arbre hiérarchique depuis une liste plate d'employés. Un
 * employé sans manager, ou dont le manager n'est pas dans la liste (quitté
 * l'entreprise, par exemple), devient une racine de l'organigramme — jamais
 * d'employé silencieusement perdu.
 */
export function buildOrgTree(employees: OrgChartEmployee[]): OrgNode[] {
  const nodeById = new Map<string, OrgNode>();
  for (const e of employees) nodeById.set(e.id, { ...e, directReports: [] });

  const roots: OrgNode[] = [];
  for (const e of employees) {
    const node = nodeById.get(e.id)!;
    if (e.managerId && nodeById.has(e.managerId)) {
      nodeById.get(e.managerId)!.directReports.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

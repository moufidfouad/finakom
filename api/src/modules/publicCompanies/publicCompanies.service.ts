import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { ListPublicCompaniesQuery } from "./publicCompanies.schemas";

/** Sélection stricte — jamais userId ni aucun champ interne (régime fiscal,
 * système comptable...) qui n'a aucune valeur pour un visiteur public et
 * pourrait servir de vecteur d'énumération. */
const PUBLIC_COMPANY_SELECT = {
  id: true,
  name: true,
  sector: true,
  country: true,
  address: true,
  logoUrl: true,
  publicDescription: true,
  updatedAt: true,
};

export async function listPublicCompanies(query: ListPublicCompaniesQuery) {
  const where = {
    directoryVisibility: "Public" as const,
    ...(query.sector && { sector: query.sector }),
    ...(query.country && { country: query.country }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: "insensitive" as const } },
        {
          publicDescription: {
            contains: query.search,
            mode: "insensitive" as const,
          },
        },
        { address: { contains: query.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.company.findMany({
      where,
      select: PUBLIC_COMPANY_SELECT,
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.company.count({ where }),
  ]);

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

/** Valeurs distinctes réellement présentes parmi les entreprises publiées —
 * jamais une liste statique qui proposerait une option ramenant zéro résultat
 * (même principe que getPublicJobPostingFacets/getPublicCvFacets). */
export async function getPublicCompanyFacets() {
  const companies = await prisma.company.findMany({
    where: { directoryVisibility: "Public" },
    select: { sector: true, country: true },
  });

  const sectors = [
    ...new Set(
      companies
        .map((c: { sector: string | null }) => c.sector)
        .filter((s: string | null): s is string => !!s),
    ),
  ].sort();
  const countries = [
    ...new Set(companies.map((c: { country: string }) => c.country)),
  ].sort();

  return { sectors, countries };
}

export async function getPublicCompany(companyId: string) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, directoryVisibility: "Public" },
    select: PUBLIC_COMPANY_SELECT,
  });
  if (!company) throw AppError.notFound("Entreprise introuvable");
  return company;
}

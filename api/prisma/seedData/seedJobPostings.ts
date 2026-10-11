/**
 * Offres d'emploi de démonstration, rattachées aux vraies entreprises seedées
 * (celles avec un compte applicatif — pas les simples clients/fournisseurs
 * textuels de referenceData.ts). Titres choisis pour recouper INTENTIONNELLEMENT
 * les CV déjà seedés dans seedCandidates.ts (ex: "Chauffeur-livreur" chez
 * Bacar BTP SARL, déjà l'employeur historique d'ATTOUMANI Salim dans son CV) —
 * pour que le moteur de notification par mots-clés ait de vraies
 * correspondances à démontrer, pas des données isolées les unes des autres.
 * Les compétences souhaitées recoupent, de la même façon, les compétences
 * déjà présentes dans ces mêmes CV.
 */
import { PrismaClient } from "@prisma/client";
import { SeededCompany } from "./seedFoundation";

interface JobPostingSeedSpec {
  title: string;
  description: string;
  location: string;
  contractType: string;
  status: "Ouverte" | "Fermée";
  desiredExperienceYears?: number;
  desiredSkills?: {
    title: string;
    level: "Débutant" | "Intermédiaire" | "Avancé" | "Expert";
  }[];
}

const POSTINGS_BY_COMPANY: Record<string, JobPostingSeedSpec[]> = {
  "Bacar BTP SARL": [
    {
      title: "Chauffeur-livreur",
      contractType: "CDI",
      location: "Moroni, Comores",
      status: "Ouverte",
      description:
        "Livraison de matériaux de construction sur nos chantiers de Grande Comore. Permis poids lourd exigé, connaissance du réseau routier local appréciée.",
      desiredExperienceYears: 3,
      desiredSkills: [
        { title: "Permis C", level: "Avancé" },
        { title: "Logistique", level: "Intermédiaire" },
      ],
    },
    {
      title: "Comptable",
      contractType: "CDI",
      location: "Moroni, Comores",
      status: "Ouverte",
      description:
        "Tenue de la comptabilité générale de l'entreprise dans le référentiel SYSCOHADA, rapprochements bancaires, préparation des déclarations fiscales.",
      desiredExperienceYears: 2,
      desiredSkills: [
        { title: "SYSCOHADA", level: "Avancé" },
        { title: "Comptabilité", level: "Avancé" },
      ],
    },
  ],
  "Nouriat Conseils & Services": [
    {
      title: "Comptable senior",
      contractType: "CDI",
      location: "Moroni, Comores",
      status: "Ouverte",
      description:
        "Cabinet de conseil recherche un comptable expérimenté pour la gestion de plusieurs dossiers clients — clôtures annuelles, déclarations TVA, conseil aux PME.",
      desiredExperienceYears: 5,
      desiredSkills: [
        { title: "SYSCOHADA", level: "Expert" },
        { title: "Excel", level: "Avancé" },
      ],
    },
    {
      title: "Assistant RH",
      contractType: "CDD",
      location: "Moroni, Comores",
      status: "Ouverte",
      description:
        "Gestion administrative du personnel pour nos clients : suivi des contrats, paie mensuelle, appui au recrutement.",
      desiredExperienceYears: 1,
      desiredSkills: [
        { title: "RH", level: "Intermédiaire" },
        { title: "Paie", level: "Intermédiaire" },
      ],
    },
  ],
  "Ahmed Import-Export": [
    {
      title: "Vendeur en boutique",
      contractType: "CDI",
      location: "Moroni, Comores",
      status: "Ouverte",
      description:
        "Accueil et conseil client dans notre point de vente, gestion des encaissements, mise en rayon.",
      desiredSkills: [
        { title: "Vente", level: "Débutant" },
        { title: "Relation client", level: "Débutant" },
      ],
    },
    {
      title: "Développeur web",
      contractType: "Freelance",
      location: "Télétravail possible",
      status: "Ouverte",
      description:
        "Refonte de notre site vitrine et développement d'un espace client simple pour le suivi de commandes.",
      desiredExperienceYears: 2,
      desiredSkills: [
        { title: "JavaScript", level: "Avancé" },
        { title: "Bases de données", level: "Intermédiaire" },
      ],
    },
  ],
  "Djohar Import-Export": [
    {
      title: "Chauffeur-livreur",
      contractType: "CDI",
      location: "Mutsamudu, Anjouan",
      status: "Fermée",
      description:
        "Poste pourvu — livraisons entre Mutsamudu et les zones de stockage régionales.",
      desiredExperienceYears: 1,
      desiredSkills: [{ title: "Permis C", level: "Intermédiaire" }],
    },
  ],
};

export async function seedJobPostings(
  prisma: PrismaClient,
  company: SeededCompany,
  creatorUserId: string,
): Promise<number> {
  const specs = POSTINGS_BY_COMPANY[company.name];
  if (!specs) return 0;

  for (const spec of specs) {
    await prisma.jobPosting.create({
      data: {
        companyId: company.id,
        createdById: creatorUserId,
        title: spec.title,
        description: spec.description,
        location: spec.location,
        contractType: spec.contractType,
        status: spec.status,
        desiredExperienceYears: spec.desiredExperienceYears,
        desiredSkills: spec.desiredSkills
          ? { create: spec.desiredSkills }
          : undefined,
      },
    });
  }

  console.log(
    `💼 ${specs.length} offre(s) d'emploi créée(s) pour ${company.name}`,
  );
  return specs.length;
}

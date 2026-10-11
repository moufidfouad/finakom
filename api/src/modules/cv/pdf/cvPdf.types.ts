/**
 * Type manuel plutôt que Prisma.CandidateCvGetPayload<...> — le client Prisma
 * n'est jamais régénéré dans certains environnements de développement de ce
 * projet, un type Prisma explicite y échouerait à la compilation. Une
 * interface manuelle reste stable indépendamment de l'état du client généré.
 */
export interface CvForPdf {
  title: string;
  summary: string | null;
  permits: string[];
  interests: string[];
  candidate: {
    fullName: string;
    phone: string | null;
    email: string;
    photoUrl: string | null;
  };
  educations: {
    degree: string;
    school: string;
    startYear: number;
    endYear: number | null;
  }[];
  experiences: {
    title: string;
    company: string;
    startDate: Date;
    endDate: Date | null;
    description: string | null;
  }[];
  skills: { title: string; level: string; specificities: string[] }[];
  languages: { name: string; level: string }[];
}

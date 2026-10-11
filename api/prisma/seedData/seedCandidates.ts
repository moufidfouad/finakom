/**
 * Candidats de démonstration, avec CV structurés — indépendant des
 * entreprises (contrairement au reste du seed), car Candidate est un modèle
 * global sans lien à une entreprise, cohérent avec le traitement déjà réservé
 * à seedContactMessages dans seed.ts (peuplé une seule fois, pas par entreprise).
 * Idempotent : upsert sur l'email (unique), CV recréés uniquement si le
 * candidat vient d'être créé — pour ne jamais dupliquer les CV à chaque
 * relance du script.
 *
 * Templates et réglages de visibilité volontairement variés d'un candidat à
 * l'autre — pas de valeur unique répétée partout — pour que la démonstration
 * couvre réellement les deux gabarits et les cas de masquage granulaire
 * (nom masqué, téléphone exposé), pas seulement les valeurs par défaut.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { SEED_PASSWORD } from "./seedFoundation";

type CvLevel = "Débutant" | "Intermédiaire" | "Avancé" | "Expert";

interface CandidateSeedSpec {
  fullName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  cvs: {
    title: string;
    summary: string;
    visibility: "Public" | "Brouillon";
    template: "classique" | "moderne";
    showFullName: boolean;
    showPhoto: boolean;
    showPhone: boolean;
    permits: string[];
    interests: string[];
    languages: { name: string; level: CvLevel }[];
    educations: {
      degree: string;
      school: string;
      startYear: number;
      endYear: number | null;
    }[];
    experiences: {
      title: string;
      company: string;
      startDate: string;
      endDate: string | null;
      description: string;
    }[];
    skills: { title: string; level: CvLevel; specificities: string[] }[];
  }[];
}

// Noms distincts de EMPLOYEE_POOL (des personnes différentes) mais dans le
// même style — patronyme en majuscules + prénom, cohérent avec l'univers
// comorien déjà établi ailleurs dans ce seed.
const CANDIDATES: CandidateSeedSpec[] = [
  {
    fullName: "HOUMADI Nastaha",
    email: "nastaha.houmadi@example.km",
    phone: "+269 333 12 34",
    emailVerified: true,
    cvs: [
      {
        title: "Comptable senior",
        summary:
          "Dix ans d'expérience en comptabilité générale et analytique dans le référentiel SYSCOHADA, spécialisée en clôture d'exercice et déclarations fiscales.",
        visibility: "Public",
        template: "classique",
        showFullName: true,
        showPhoto: false,
        showPhone: false,
        permits: ["Permis B"],
        interests: ["Lecture", "Randonnée"],
        languages: [
          { name: "Français", level: "Expert" },
          { name: "Anglais", level: "Intermédiaire" },
        ],
        educations: [
          {
            degree: "Licence en comptabilité et gestion",
            school: "Université des Comores",
            startYear: 2011,
            endYear: 2014,
          },
        ],
        experiences: [
          {
            title: "Comptable senior",
            company: "Cabinet AZ Conseil",
            startDate: "2019-03-01",
            endDate: null,
            description:
              "Tenue complète de la comptabilité de plusieurs PME clientes, clôtures annuelles, déclarations TVA.",
          },
          {
            title: "Comptable",
            company: "Grossiste Anjouan Import",
            startDate: "2014-09-01",
            endDate: "2019-02-28",
            description:
              "Saisie des écritures, rapprochements bancaires, suivi de trésorerie.",
          },
        ],
        skills: [
          {
            title: "SYSCOHADA",
            level: "Expert",
            specificities: [
              "Clôtures annuelles",
              "Déclarations TVA",
              "Rapprochements bancaires",
            ],
          },
          {
            title: "Comptabilité",
            level: "Expert",
            specificities: ["Comptabilité générale", "Comptabilité analytique"],
          },
          {
            title: "Excel",
            level: "Avancé",
            specificities: ["Tableaux croisés dynamiques"],
          },
        ],
      },
    ],
  },
  {
    fullName: "BACAR Abdillah",
    email: "abdillah.bacar@example.km",
    phone: "+269 332 45 67",
    emailVerified: true,
    cvs: [
      {
        title: "Développeur web",
        summary:
          "Développeur autodidacte spécialisé en applications web, à la recherche d'un poste en entreprise pour poursuivre son évolution technique.",
        visibility: "Public",
        template: "moderne",
        showFullName: true,
        showPhoto: false,
        showPhone: true,
        permits: [],
        interests: ["Jeux vidéo", "Contribution open source"],
        languages: [
          { name: "Français", level: "Expert" },
          { name: "Anglais", level: "Avancé" },
        ],
        educations: [
          {
            degree: "BTS Informatique de gestion",
            school: "Institut Supérieur de Technologie de Moroni",
            startYear: 2018,
            endYear: 2020,
          },
        ],
        experiences: [
          {
            title: "Développeur freelance",
            company: "Indépendant",
            startDate: "2020-06-01",
            endDate: null,
            description:
              "Sites vitrines et applications de gestion pour petites entreprises locales.",
          },
        ],
        skills: [
          {
            title: "JavaScript",
            level: "Avancé",
            specificities: ["React", "Node.js", "API REST"],
          },
          {
            title: "IT",
            level: "Avancé",
            specificities: ["Déploiement serveur", "Nom de domaine et DNS"],
          },
          {
            title: "Bases de données",
            level: "Intermédiaire",
            specificities: ["PostgreSQL", "MySQL"],
          },
        ],
      },
    ],
  },
  {
    fullName: "IBRAHIM Nadjima",
    email: "nadjima.ibrahim@example.km",
    phone: "+269 331 78 90",
    emailVerified: true,
    cvs: [
      {
        title: "Assistante RH",
        summary:
          "Cinq ans d'expérience en gestion administrative du personnel et recrutement au sein de PME locales.",
        // Nom masqué volontairement — teste le cas d'anonymat partiel sur le
        // profil public (le visiteur verra "Candidat" au lieu du vrai nom).
        visibility: "Public",
        template: "moderne",
        showFullName: false,
        showPhoto: false,
        showPhone: false,
        permits: ["Permis B"],
        interests: ["Bénévolat associatif", "Cuisine"],
        languages: [{ name: "Français", level: "Expert" }],
        educations: [
          {
            degree: "Licence en gestion des ressources humaines",
            school: "Université des Comores",
            startYear: 2015,
            endYear: 2018,
          },
        ],
        experiences: [
          {
            title: "Assistante RH",
            company: "Coopérative Agricole de Mwali",
            startDate: "2018-10-01",
            endDate: null,
            description:
              "Suivi des contrats, paie mensuelle, organisation du recrutement.",
          },
        ],
        skills: [
          {
            title: "RH",
            level: "Avancé",
            specificities: ["Onboarding", "Suivi des contrats"],
          },
          {
            title: "Recrutement",
            level: "Intermédiaire",
            specificities: ["Présélection de CV", "Entretiens"],
          },
          { title: "Paie", level: "Avancé", specificities: [] },
        ],
      },
      // Second CV du même candidat, en brouillon — teste qu'un candidat peut
      // avoir plusieurs CV avec des visibilités différentes.
      {
        title: "Assistante de direction",
        summary:
          "Profil polyvalent, en réflexion sur une réorientation vers l'assistanat de direction.",
        visibility: "Brouillon",
        template: "classique",
        showFullName: true,
        showPhoto: false,
        showPhone: false,
        permits: ["Permis B"],
        interests: [],
        languages: [{ name: "Français", level: "Expert" }],
        educations: [
          {
            degree: "Licence en gestion des ressources humaines",
            school: "Université des Comores",
            startYear: 2015,
            endYear: 2018,
          },
        ],
        experiences: [],
        skills: [{ title: "Organisation", level: "Avancé", specificities: [] }],
      },
    ],
  },
  {
    fullName: "ATTOUMANI Salim",
    email: "salim.attoumani@example.km",
    phone: "+269 334 56 78",
    emailVerified: true,
    cvs: [
      {
        title: "Chauffeur-livreur",
        summary:
          "Permis poids lourd, connaissance approfondie du réseau routier de Grande Comore, dix ans d'expérience en logistique.",
        visibility: "Public",
        template: "classique",
        showFullName: true,
        showPhoto: false,
        showPhone: false,
        permits: ["Permis B", "Permis C", "Permis EC"],
        interests: ["Football"],
        languages: [
          { name: "Français", level: "Intermédiaire" },
          { name: "Comorien", level: "Expert" },
        ],
        educations: [],
        experiences: [
          {
            title: "Chauffeur-livreur",
            company: "Bacar BTP SARL",
            startDate: "2015-01-01",
            endDate: null,
            description:
              "Livraisons de matériaux de construction sur chantiers, gestion des bons de livraison.",
          },
        ],
        skills: [
          {
            title: "Permis C",
            level: "Expert",
            specificities: ["Conduite poids lourd", "Chargement sécurisé"],
          },
          {
            title: "Logistique",
            level: "Avancé",
            specificities: ["Gestion de tournées", "Bons de livraison"],
          },
        ],
      },
    ],
  },
  // Candidat avec email NON vérifié — teste le flux de vérification côté
  // frontend (bandeau d'incitation sur le tableau de bord candidat).
  {
    fullName: "MZE Chamsia",
    email: "chamsia.mze@example.km",
    phone: "+269 335 90 12",
    emailVerified: false,
    cvs: [
      {
        title: "Vendeuse en boutique",
        summary:
          "À la recherche d'un premier emploi dans la vente, dynamique et motivée.",
        visibility: "Public",
        template: "classique",
        showFullName: true,
        showPhoto: false,
        showPhone: false,
        permits: [],
        interests: ["Mode", "Réseaux sociaux"],
        languages: [{ name: "Français", level: "Avancé" }],
        educations: [
          {
            degree: "Baccalauréat général",
            school: "Lycée de Moroni",
            startYear: 2020,
            endYear: 2023,
          },
        ],
        experiences: [],
        skills: [
          { title: "Vente", level: "Débutant", specificities: [] },
          {
            title: "Relation client",
            level: "Intermédiaire",
            specificities: [],
          },
        ],
      },
    ],
  },
];

export async function seedCandidates(
  prisma: PrismaClient,
): Promise<{ createdCount: number; cvCount: number }> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  let createdCount = 0;
  let cvCount = 0;

  for (const spec of CANDIDATES) {
    const existing = await prisma.candidate.findUnique({
      where: { email: spec.email },
    });
    if (existing) continue; // idempotence : candidat déjà seedé, ses CV aussi

    const candidate = await prisma.candidate.create({
      data: {
        email: spec.email,
        passwordHash,
        fullName: spec.fullName,
        phone: spec.phone,
        emailVerified: spec.emailVerified,
        authProvider: "local",
      },
    });
    createdCount += 1;

    for (const cv of spec.cvs) {
      await prisma.candidateCv.create({
        data: {
          candidateId: candidate.id,
          title: cv.title,
          summary: cv.summary,
          visibility: cv.visibility,
          template: cv.template,
          showFullName: cv.showFullName,
          showPhoto: cv.showPhoto,
          showPhone: cv.showPhone,
          permits: cv.permits,
          interests: cv.interests,
          educations: { create: cv.educations },
          experiences: {
            create: cv.experiences.map((e) => ({
              ...e,
              startDate: new Date(e.startDate),
              endDate: e.endDate ? new Date(e.endDate) : null,
            })),
          },
          skills: { create: cv.skills },
          languages: { create: cv.languages },
        },
      });
      cvCount += 1;
    }

    console.log(`🎓 Candidat  ${candidate.email} (${spec.cvs.length} CV)`);
  }

  return { createdCount, cvCount };
}

export type UserRole = "USER" | "ADMIN" | "SUPERADMIN";

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  emailVerified?: boolean;
  authProvider?: "local" | "google";
}

/** Entièrement distinct de User — un candidat n'a ni role plateforme ni
 * rattachement à une entreprise. */
export interface Candidate {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  photoUrl: string | null;
  emailVerified: boolean;
}

// ==================== RECRUTEMENT ====================

export interface CvEducation {
  id: string;
  degree: string;
  school: string;
  startYear: number;
  endYear: number | null;
}

export interface CvExperience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

export type CvSkillLevel = "Débutant" | "Intermédiaire" | "Avancé" | "Expert";

export interface CvSkill {
  id: string;
  title: string;
  level: CvSkillLevel;
  specificities: string[];
}

export interface CvLanguage {
  id: string;
  name: string;
  level: CvSkillLevel;
}

export type CvVisibility = "Brouillon" | "Public";
export type CvTemplate =
  | "classique"
  | "moderne"
  | "compact"
  | "chronologique"
  | "deux-colonnes";

export interface Cv {
  id: string;
  candidateId: string;
  title: string;
  summary: string | null;
  visibility: CvVisibility;
  template: CvTemplate;
  showFullName: boolean;
  showPhoto: boolean;
  showPhone: boolean;
  createdAt: string;
  updatedAt: string;
  educations: CvEducation[];
  experiences: CvExperience[];
  skills: CvSkill[];
  languages: CvLanguage[];
  permits: string[];
  interests: string[];
}

/** Version publique d'un CV — le nom, la photo et le téléphone du candidat
 * ont déjà été masqués côté backend (applyPersonalInfoVisibility) selon les
 * préférences showFullName/showPhoto/showPhone de CE CV ; jamais son email,
 * quelle que soit la préférence (voir publicCandidates.service.ts côté
 * backend : sélection stricte des champs exposés). */
export interface PublicCv {
  id: string;
  title: string;
  summary: string | null;
  template: CvTemplate;
  updatedAt: string;
  educations: CvEducation[];
  experiences: CvExperience[];
  skills: CvSkill[];
  languages: CvLanguage[];
  permits: string[];
  interests: string[];
  candidate: {
    fullName: string;
    photoUrl: string | null;
    phone: string | null;
  };
}

export interface CvEducationInput {
  degree: string;
  school: string;
  startYear: number;
  endYear?: number | null;
}

export interface CvExperienceInput {
  title: string;
  company: string;
  startDate: string;
  endDate?: string | null;
  description?: string;
}

export interface CvSkillInput {
  title: string;
  level: CvSkillLevel;
  specificities: string[];
}

export interface CvLanguageInput {
  name: string;
  level: CvSkillLevel;
}

export interface CvInput {
  title: string;
  summary?: string;
  educations: CvEducationInput[];
  experiences: CvExperienceInput[];
  skills: CvSkillInput[];
  languages: CvLanguageInput[];
  permits: string[];
  interests: string[];
}

export type JobPostingStatus = "Ouverte" | "Fermée";

export interface JobPostingSkill {
  id: string;
  title: string;
  level: CvSkillLevel;
}

export interface JobPosting {
  id: string;
  companyId: string;
  title: string;
  description: string;
  location: string | null;
  contractType: string;
  status: JobPostingStatus;
  desiredExperienceYears: number | null;
  desiredSkills: JobPostingSkill[];
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { applications: number };
}

export interface PublicJobPosting extends JobPosting {
  company: { id: string; name: string; logoUrl: string | null };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface JobPostingFacets {
  contractTypes: string[];
  locations: string[];
  skills: string[];
}

export interface CvFacets {
  skills: string[];
}

/** Sélection publique — jamais userId ni aucun champ interne (régime fiscal,
 * système comptable) qui n'a aucune valeur pour un visiteur et pourrait
 * servir de vecteur d'énumération (cohérent avec la sélection stricte déjà
 * appliquée côté backend). */
export interface PublicCompany {
  id: string;
  name: string;
  sector: string | null;
  country: string;
  address: string | null;
  logoUrl: string | null;
  publicDescription: string | null;
  updatedAt: string;
}

export interface CompanyFacets {
  sectors: string[];
  countries: string[];
}

/** Distinct de CvSkillInput — les compétences souhaitées d'une offre n'ont
 * jamais eu de spécificités côté backend (JobPostingSkill = titre + niveau
 * seulement), pas de raison de réutiliser un type conçu pour le CV candidat
 * qui a divergé depuis. */
export interface JobPostingSkillInput {
  title: string;
  level: CvSkillLevel;
}

export interface JobPostingInput {
  title: string;
  description: string;
  location?: string;
  contractType: string;
  desiredExperienceYears?: number;
  desiredSkills: JobPostingSkillInput[];
}

export type JobApplicationStatus = "Reçue" | "En cours" | "Retenue" | "Refusée";

export interface JobApplication {
  id: string;
  jobPostingId: string;
  candidateId: string;
  cvSnapshot: Cv;
  status: JobApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateJobApplication extends JobApplication {
  jobPosting: PublicJobPosting;
}

export interface CandidateJobMatchNotification {
  type: "job_match";
  id: string;
  candidateId: string;
  jobPostingId: string;
  createdAt: string;
  readAt: string | null;
  emailedAt: string | null;
  jobPosting: PublicJobPosting;
}

export interface CandidateContactMessageNotification {
  type: "contact_message";
  id: string;
  candidateId: string;
  cvId: string;
  cvTitle: string;
  senderName: string;
  senderEmail: string;
  message: string;
  createdAt: string;
  readAt: string | null;
}

export interface NewMessageNotification {
  type: "new_message";
  id: string;
  conversationId: string;
  otherParticipant: ConversationParticipant | undefined;
  lastMessage: Message;
  createdAt: string;
  readAt: null;
}

export type CandidateJobNotification =
  | CandidateJobMatchNotification
  | CandidateContactMessageNotification
  | NewMessageNotification;

export interface CompanyApplicationNotification {
  type: "application";
  id: string;
  companyId: string;
  jobApplicationId: string;
  createdAt: string;
  readAt: string | null;
  jobApplication: {
    jobPosting: { id: string; title: string };
    candidate: { fullName: string };
  };
}

export type CompanyNotification =
  | CompanyApplicationNotification
  | NewMessageNotification;

export type CompanyRole = "ADMIN" | "MEMBER";

export interface CompanyMember {
  role: CompanyRole;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    createdAt: string;
  };
}

export interface CreateMemberInput {
  email: string;
  fullName?: string;
  password?: string;
  role: CompanyRole;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  createdAt: string;
  _count: { companies: number; companyMemberships: number };
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  role?: UserRole;
}

export type AccountingSystem = "Normal" | "SMT";

export interface Company {
  id: string;
  userId: string;
  name: string;
  country: string;
  currency: string;
  sector: string | null;
  address: string | null;
  accountingSystem: AccountingSystem;
  fiscalRegime: string | null;
  /** Chemin relatif sous /uploads (ex: "logos/{id}.png") — servi statiquement par le backend. */
  logoUrl: string | null;
  directoryVisibility: "Brouillon" | "Public";
  publicDescription: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { analyses: number };
  /** Renseigné uniquement pour un SUPERADMIN, qui voit les entreprises de tous les utilisateurs. */
  user?: { email: string; fullName: string | null };
}

export interface CompanyInput {
  name: string;
  country: string;
  currency: string;
  sector: string;
  address?: string;
  accountingSystem: AccountingSystem;
  fiscalRegime: string;
}

// ---- Facturation & Inventaire ----
export type ClientType = "Entreprise" | "Particulier";
export type ClientQuality = "Nouveau" | "Bon" | "Excellent";

export interface Client {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: ClientType;
  address: string | null;
  phone: string | null;
  email: string | null;
  rccm: string | null;
  quality: ClientQuality;
  creditLimit: string | null;
  defaultDiscountPercent: string | null;
}

export interface ClientInput {
  name: string;
  type: ClientType;
  address?: string;
  phone?: string;
  email?: string;
  rccm?: string;
  quality: ClientQuality;
  // Encours maximum autorisé — jamais bloquant, purement informatif. Chaîne
  // vide = aucune limite (efface le champ), voir clients.schemas.ts côté
  // backend pour la transformation exacte de cette valeur.
  creditLimit?: number | "";
  // Remise standard négociée (0-100%) — pré-remplit le prix des nouvelles
  // lignes de document pour ce client, toujours modifiable au cas par cas.
  // Chaîne vide = aucune remise configurée (distinct de 0%, une vraie valeur).
  defaultDiscountPercent?: number | "";
}

export interface CreditStatus {
  creditLimit: number | null;
  currentOutstanding: number;
  projectedOutstanding: number;
  wouldExceed: boolean;
  excessAmount: number;
}

export interface NegotiatedPrice {
  id: string;
  clientId: string;
  productId: string;
  product: {
    id: string;
    code: string;
    designation: string;
    sellingPriceHT: string;
  };
  unitPriceHT: string;
  notes: string | null;
}

export interface ResolvedPrice {
  resolvedPriceHT: number;
  catalogPriceHT: number;
  source: "negotiated" | "discount" | "catalog";
}

export interface StockCalc {
  stockInitial: number;
  totalEntries: number;
  totalExits: number;
  stockFinal: number;
  stockMin: number;
  alertLevel: 0 | 1 | 2;
  alertLabel: "Rupture" | "Sous le seuil" | "OK";
  unitCost: number;
  stockValue: number;
}

export interface Product {
  id: string;
  companyId: string;
  code: string;
  designation: string;
  unit: string;
  category: string;
  sellingPriceHT: string;
  unitCost: string | null;
  trackInventory: boolean;
  stockMin: string;
  stockInitial: string;
  stock: StockCalc | null;
}

export interface ProductInput {
  designation: string;
  unit: string;
  category: string;
  sellingPriceHT: number;
  unitCost?: number;
  trackInventory: boolean;
  stockMin: number;
  stockInitial: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  date: string;
  type: "Entrée" | "Sortie";
  quantity: string;
  reference: string | null;
}

export interface StockMovementInput {
  date: string;
  type: "Entrée" | "Sortie";
  quantity: number;
  reference?: string;
}

export type DocumentType = "Devis" | "Facture" | "Bon de livraison" | "Avoir";

export interface DocumentLine {
  id: string;
  documentId: string;
  productId: string | null;
  designation: string;
  quantity: string;
  quantityDelivered: string | null;
  unitPriceHT: string;
  observation: string | null;
  lineOrder: number;
}

export interface DocumentLineInput {
  productId?: string;
  designation?: string;
  quantity: number;
  unitPriceHT?: number;
  observation?: string;
}

export interface DocumentTotals {
  totalHT: number;
  tvaRatePercent: number;
  totalTVA: number;
  totalTTC: number;
}

export interface PaymentSummary {
  totalTTC: number;
  totalPaid: number;
  remaining: number;
  percentPaid: number;
  status: "Payée" | "Partielle" | "Impayée";
}

export interface Payment {
  id: string;
  documentId: string;
  amount: string;
  date: string;
  method: string | null;
  note: string | null;
}

export interface PaymentInput {
  amount: number;
  date: string;
  method?: string;
  note?: string;
}

export interface SalesDocument {
  id: string;
  companyId: string;
  type: DocumentType;
  number: string;
  clientId: string;
  client: Client;
  date: string;
  status: string;
  tvaRatePercent: string;
  linkedQuoteId: string | null;
  linkedInvoiceId: string | null;
  createdById: string | null;
  createdBy: { id: string; email: string; fullName: string | null } | null;
  notes: string | null;
  lines: DocumentLine[];
  payments: Payment[];
  totals: DocumentTotals;
  paymentSummary: PaymentSummary | null;
}

export interface CreateDocumentInput {
  type: DocumentType;
  clientId: string;
  date: string;
  notes?: string;
  linkedInvoiceId?: string; // obligatoire côté serveur pour un Avoir
  lines: DocumentLineInput[];
}

export interface UpdateDocumentInput {
  clientId?: string;
  date?: string;
  notes?: string;
  lines?: DocumentLineInput[];
}

export interface InvoicingSettings {
  companyId: string;
  tvaRatePercent: string;
  quoteValidityDays: number;
  paymentTermsDays: number;
  latePenaltyRatePercent: string;
  cashDiscountRatePercent: string;
  vatMention: string | null;
  paymentConditions: string | null;
  deliveryConditions: string | null;
  legalMention: string | null;
  warranty: string | null;
  bankDetails: string | null;
}

export interface InvoicingDashboard {
  activite: {
    devisEmis: number;
    devisAcceptes: number;
    tauxConversionDevis: number;
    facturesEmises: number;
    bonsLivraison: number;
    valeurDevisEnAttente: number;
  };
  chiffreAffaires: {
    caFactureTTC: number;
    caFactureHT: number;
    tvaCollectee: number;
    factureMoyenneTTC: number;
    plusGrosseFacture: number;
  };
  encaissements: {
    totalFactureTTC: number;
    encaisse: number;
    resteARecouvrer: number;
    tauxRecouvrement: number;
    facturesImpayees: number;
    facturesPartielles: number;
  };
  catalogue: {
    clientsCount: number;
    clientsEntreprises: number;
    articlesCount: number;
    prixMoyenHT: number;
  };
  stock: {
    articlesSuivis: number;
    enRupture: number;
    sousLeSeuil: number;
    valeurTotaleStock: number;
  };
}

// ==================== MODULE GESTION DU PERSONNEL ====================

export type EmployeeStatus = "Actif" | "Inactif" | "Suspendu" | "Démissionné";
export type Gender = "M" | "F";

export interface Employee {
  id: string;
  companyId: string;
  code: string;
  fullName: string;
  position: string;
  department: string;
  employmentType: string;
  grossSalary: string;
  hireDate: string;
  contractType: string;
  gender: Gender;
  city: string | null;
  phone: string | null;
  email: string | null;
  status: EmployeeStatus;
  workLocation: string | null;
  weeklyHours: string | null;
  trialPeriodMonths: number | null;
  contractEndDate: string | null;
  managerId: string | null;
}

export interface EmployeeInput {
  fullName: string;
  position: string;
  department: string;
  employmentType: string;
  grossSalary: number;
  hireDate: string;
  contractType: string;
  gender: Gender;
  city?: string;
  phone?: string;
  email?: string;
  status: EmployeeStatus;
  // Champs dédiés à la génération du contrat de travail — optionnels, sans
  // impact sur la paie/présences. À remplir seulement si un contrat doit être imprimé.
  workLocation?: string;
  weeklyHours?: number;
  trialPeriodMonths?: number;
  contractEndDate?: string;
  // Organigramme — supérieur hiérarchique direct. Chaîne vide = aucun manager
  // (efface le champ), voir employees.schemas.ts côté backend pour la
  // transformation exacte de cette valeur.
  managerId?: string;
}

export interface OrgNode {
  id: string;
  fullName: string;
  position: string;
  managerId: string | null;
  directReports: OrgNode[];
}

export interface LeaveBalance {
  monthsWorked: number;
  accruedDays: number;
  takenDays: number;
  balanceDays: number;
}

export type AttendanceStatus =
  | "Présent"
  | "Absence justifiée"
  | "Absence injustifiée"
  | "Congé"
  | "Maladie";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  reason: string | null;
  daysPresent: number;
  daysWorkable: number;
}

export interface AttendanceInput {
  date: string;
  status: AttendanceStatus;
  reason?: string;
  daysPresent: number;
  daysWorkable: number;
}

export type LatenessStatus = "Justifié" | "Non justifié" | "Toléré";

export interface LatenessRecord {
  id: string;
  employeeId: string;
  date: string;
  scheduledTime: string;
  arrivalTime: string;
  lateMinutes: number;
  reason: string | null;
  status: LatenessStatus;
}

export interface LatenessInput {
  date: string;
  scheduledTime: string;
  arrivalTime: string;
  lateMinutes: number;
  reason?: string;
  status: LatenessStatus;
}

export interface WorkedHoursRecord {
  id: string;
  employeeId: string;
  periodDate: string;
  contractualHours: string;
  actualHours: string;
}

export interface WorkedHoursInput {
  periodDate: string;
  contractualHours: number;
  actualHours: number;
}

export type PaymentStatusHr = "Payé" | "En attente";

export interface PayrollRecord {
  id: string;
  employeeId: string;
  periodDate: string;
  grossSalary: string;
  bonus: string;
  latePenalty: string;
  socialContribution: string;
  paymentStatus: PaymentStatusHr;
  paymentDate: string | null;
}

export interface PayrollInput {
  periodDate: string;
  grossSalary: number;
  bonus?: number;
  latePenalty?: number;
  socialContribution: number;
  paymentStatus?: PaymentStatusHr;
  paymentDate?: string;
}

export type LeaveStatus = "Approuvé" | "En attente" | "Refusé";

export interface LeaveRequestRecord {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  status: LeaveStatus;
  notes: string | null;
}

export interface LeaveInput {
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  status?: LeaveStatus;
  notes?: string;
}

export interface HrDashboard {
  activeEmployeeCount: number;
  grossPayrollMass: number;
  netPayrollMass: number;
  absenteeismRate: number | null;
  latenessCount: number;
  totalOvertimeHours: number;
  contractBreakdown: Record<string, number>;
  genderBreakdown: Record<string, number>;
}

export interface Payslip {
  employee: {
    code: string;
    fullName: string;
    position: string;
    department: string;
    contractType: string;
    city: string | null;
    hireDate: string;
  };
  period: string;
  hours: {
    contractualHours: number;
    actualHours: number;
    overtimeHours: number;
    hourlyRate: number;
    overtimePay: number;
    status: string;
  };
  payroll: {
    grossSalary: number;
    bonus: number;
    latePenalty: number;
    socialContribution: number;
    overtimePay: number;
    totalGross: number;
    netSalary: number;
  };
  paymentStatus: PaymentStatusHr;
  paymentDate: string | null;
}

// ==================== MODULE ANALYSE FINANCIÈRE ====================

export type AnalysisStatus = "draft" | "completed";

export interface Analysis {
  id: string;
  companyId: string;
  label: string;
  exerciceNDate: string;
  exerciceN1Date: string | null;
  analystName: string | null;
  status: AnalysisStatus;
  _count?: { balanceLines: number };
}

export interface AnalysisInput {
  label: string;
  exerciceNDate: string;
  exerciceN1Date?: string;
  analystName?: string;
}

export interface FullReport {
  controles: {
    ecartDebitCredit: { n: number; n1: number; equilibre: boolean };
    ecartActifPassif: { n: number; n1: number; equilibre: boolean };
  };
  bilan: {
    actif: {
      totalGeneralActif: { n: number; n1: number; variationPct: number | null };
    };
    passif: {
      totalGeneralPassif: {
        n: number;
        n1: number;
        variationPct: number | null;
      };
    };
    equilibreFonctionnel: {
      fondsDeRoulement: { n: number; n1: number };
      besoinFondsDeRoulement: { n: number; n1: number };
      tresorerieNette: { n: number; n1: number };
    };
  };
  resultat: {
    chiffreAffaires: { n: number; n1: number };
    valeurAjoutee: { n: number; n1: number };
    resultatNet: { n: number; n1: number };
    cafg: { n: number; n1: number };
  };
  synthese: {
    noteSante: { noteGlobale: number; appreciation: string };
    pointsDeVigilance: { message: string; ok: boolean }[];
  };
}

// ==================== MODULE IMMOBILISATIONS ====================

export type DepreciationMethod = "Linéaire" | "Dégressif" | "Non amortissable";
export type AssetStatus = "Actif" | "Amorti" | "Non amortissable";

export interface FixedAssetSettings {
  companyId: string;
  fiscalYear: number;
  closingDate: string;
  corporealThreshold: string;
  incorporealThreshold: string;
  degressiveCoefficient: string;
}

export interface DepreciationResult {
  rate: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  annualDotation: number;
  status: AssetStatus;
}

export interface FixedAsset {
  id: string;
  companyId: string;
  code: string;
  accountNumber: string;
  acquisitionDate: string;
  designation: string;
  category: string;
  location: string | null;
  method: DepreciationMethod;
  durationYears: number | null;
  grossValue: string;
  createdById: string | null;
  createdBy: { id: string; email: string; fullName: string | null } | null;
  notes: string | null;
  depreciation: DepreciationResult;
}

export interface FixedAssetInput {
  accountNumber: string;
  acquisitionDate: string;
  designation: string;
  category: string;
  location?: string;
  method: DepreciationMethod;
  durationYears?: number;
  grossValue: number;
  notes?: string;
}

export type AssetMovementType = "Acquisition" | "Cession" | "Mise en rebut";

export interface AssetMovement {
  id: string;
  fixedAssetId: string | null;
  date: string;
  pieceNumber: string | null;
  designation: string;
  type: AssetMovementType;
  amount: string;
  disposalPrice: string | null;
  disposalGainLoss?: number | null;
  notes: string | null;
}

export interface AssetMovementInput {
  date: string;
  pieceNumber?: string;
  designation: string;
  type: AssetMovementType;
  amount?: number;
  disposalPrice?: number;
  notes?: string;
}

export interface FixedAssetDashboard {
  patrimoine: {
    assetsCount: number;
    grossValueTotal: number;
    accumulatedDepreciationTotal: number;
    netBookValueTotal: number;
    globalDepreciationRate: number;
    annualDotationTotal: number;
    activeCount: number;
    fullyDepreciatedCount: number;
  };
  byCategoryVNC: Record<string, number>;
  movementsN: {
    acquisitions: number;
    disposals: number;
    scrapped: number;
    movementsCount: number;
    renewalRate: number;
  };
  alerts: {
    over80PercentDepreciated: number;
    noDepreciationRecorded: number;
    underThreshold: number;
    vncUnder10Percent: number;
  };
  fiscalYear: number;
  closingDate: string;
}

// ==================== MODULE TRÉSORERIE ====================

export type TreasuryEntryType = "Encaissement" | "Décaissement";
export type TreasurySupport =
  | "Caisse"
  | "Banque"
  | "Orange Money"
  | "MTN MoMo"
  | "Wave";
export type TreasuryEntryStatus = "Réalisé" | "Prévu";

export interface TreasurySettings {
  companyId: string;
  openingCashBalance: string;
  openingBankBalance: string;
  alertThreshold: string;
  criticalThreshold: string;
  avgCollectionDays: number;
  avgPaymentDays: number;
}

export interface TreasuryEntry {
  id: string;
  companyId: string;
  date: string;
  pieceNumber: string | null;
  label: string;
  category: string;
  type: TreasuryEntryType;
  amount: string;
  support: TreasurySupport;
  paymentMethod: string | null;
  status: TreasuryEntryStatus;
  createdById: string | null;
  createdBy: { id: string; email: string; fullName: string | null } | null;
  notes: string | null;
}

export interface TreasuryEntryInput {
  date: string;
  pieceNumber?: string;
  label: string;
  category: string;
  type: TreasuryEntryType;
  amount: number;
  support: TreasurySupport;
  paymentMethod?: string;
  status?: TreasuryEntryStatus;
  notes?: string;
}

export interface TreasuryBudgetLine {
  id: string;
  companyId: string;
  fiscalYear: number;
  rubric: string;
  type: TreasuryEntryType;
  month: number;
  amount: string;
}

export interface TreasuryBudgetLineInput {
  fiscalYear: number;
  rubric: string;
  type: TreasuryEntryType;
  month: number;
  amount: number;
}

export type TreasurySignal = "CRITIQUE" | "ALERTE" | "OK";

export interface MonthlyBalance {
  month: number;
  inflow: number;
  outflow: number;
  netFlow: number;
  openingBalance: number;
  closingBalance: number;
  signal: TreasurySignal;
}

export interface TreasuryDashboard {
  position: {
    totalBalance: number;
    bankBalance: number;
    cashBalance: number;
    inflowYTD: number;
    outflowYTD: number;
    netFlowYTD: number;
    alertThreshold: number;
    signal: TreasurySignal;
  };
  forecast: {
    inflowAnnual: number;
    outflowAnnual: number;
    netFlowAnnual: number;
    finalBalance: number;
    minBalance: number;
    criticalMonths: number;
    alertMonths: number;
    okMonths: number;
    schedule: MonthlyBalance[];
  };
  actualVsForecast: {
    inflowActual: number;
    outflowActual: number;
    inflowVariance: number;
    outflowVariance: number;
    netFlowVariance: number;
    inflowRealizationRate: number;
    outflowRealizationRate: number;
    schedule: MonthlyBalance[];
  };
  indicators: {
    avgCollectionDays: number;
    avgPaymentDays: number;
    pctInflowBank: number;
    pctInflowMobileMoney: number;
    operationsCount: number;
    lastEntryDate: string | null;
    knownInflowCategories: readonly string[];
  };
}

// ==================== MODULE BUSINESS PLAN ====================

export type BusinessPlanStatus = "Brouillon" | "Finalisé";

export interface NarrativeSections {
  presentation?: string;
  executiveSummary?: string;
  organisation?: string;
  marketStudy?: string;
  pestel?: string;
  swot?: string;
  competitors?: string;
  targetClients?: string;
  offerPricing?: string;
  strategy?: string;
}

export interface BusinessPlan {
  id: string;
  companyId: string;
  title: string;
  status: BusinessPlanStatus;
  horizonYears: number;
  narrativeSections: NarrativeSections | null;
  createdById: string | null;
  createdBy: { id: string; email: string; fullName: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessPlanInput {
  title: string;
  horizonYears?: number;
}

export interface UpdateBusinessPlanInput {
  title?: string;
  status?: BusinessPlanStatus;
  horizonYears?: number;
  narrativeSections?: NarrativeSections;
}

export interface BusinessPlanInvestment {
  id: string;
  category: string;
  description: string;
  amount: string;
  notes: string | null;
}
export interface InvestmentInput {
  category: string;
  description: string;
  amount: number;
  notes?: string;
}

export type FundingType =
  | "Apport personnel"
  | "Emprunt bancaire"
  | "Subvention"
  | "Love money"
  | "Autre";
export interface BusinessPlanFunding {
  id: string;
  type: FundingType;
  detail: string;
  amount: string;
  notes: string | null;
}
export interface FundingInput {
  type: FundingType;
  detail: string;
  amount: number;
  notes?: string;
}

export interface BusinessPlanSupplier {
  id: string;
  name: string;
  supplyType: string;
  annualAmount: string;
  notes: string | null;
}
export interface BusinessPlanSupplierInput {
  name: string;
  supplyType: string;
  annualAmount?: number;
  notes?: string;
}

export type PLSection =
  | "ChiffreAffaires"
  | "ChargesVariables"
  | "ChargesFixes"
  | "ChargesPersonnel"
  | "ImpotsTaxes"
  | "ChargesFinancieres"
  | "ImpotSocietes";

export interface BusinessPlanPLLine {
  id: string;
  year: number;
  section: PLSection;
  label: string;
  amount: string;
}
export interface PLLineInput {
  year: number;
  section: PLSection;
  label: string;
  amount: number;
}

export interface BusinessPlanCashflowLine {
  id: string;
  month: number;
  type: "Encaissement" | "Décaissement";
  category: string;
  label: string;
  amount: string;
}
export interface CashflowLineInput {
  month: number;
  type: "Encaissement" | "Décaissement";
  category: string;
  label: string;
  amount: number;
}

export type BalanceSide = "Actif" | "Passif";
export interface BusinessPlanBalanceLine {
  id: string;
  year: number;
  side: BalanceSide;
  category: string;
  amount: string;
}
export interface BalanceLineInput {
  year: number;
  side: BalanceSide;
  category: string;
  amount: number;
}

export interface PLYearResult {
  chiffreAffaires: number;
  chargesVariables: number;
  margeBrute: number;
  chargesFixes: number;
  chargesPersonnel: number;
  excedentBrutExploitation: number;
  impotsTaxes: number;
  chargesFinancieres: number;
  resultatAvantImpots: number;
  impotSocietes: number;
  resultatNet: number;
  tauxMargeBrute: number | null;
  margeNette: number | null;
  seuilDeRentabilite: number | null;
}

export interface BalanceYearResult {
  totalActif: number;
  totalPassif: number;
  bfr: number;
  tresorerieNette: number;
  tauxEndettement: number | null;
  autonomieFinanciere: number | null;
  isEquilibre: boolean;
}

export interface BusinessPlanSummary {
  plan: {
    id: string;
    title: string;
    status: BusinessPlanStatus;
    horizonYears: number;
  };
  investmentFunding: {
    totalInvestment: number;
    totalFunding: number;
    balance: number;
    isFullyFunded: boolean;
  };
  profitLoss: {
    byYear: Record<string, PLYearResult>;
    profitabilityMessage: string;
  };
  cashflow: { schedule: MonthlyBalance[]; totalYearEnd: number };
  balance: {
    byYear: Record<string, BalanceYearResult>;
    healthAppreciation: {
      message: string;
      level: "bon" | "fragile" | "desequilibre";
    };
  };
}

// ==================== MODULE COMPTABILITÉ GÉNÉRALE ====================

export type JournalType =
  | "ACHATS"
  | "VENTES"
  | "BANQUE"
  | "CAISSE"
  | "OD"
  | "PAIE";

export type AccountRole =
  | "CLIENTS"
  | "FOURNISSEURS"
  | "VENTES_MARCHANDISES"
  | "VENTES_SERVICES"
  | "TVA_COLLECTEE"
  | "TVA_DEDUCTIBLE"
  | "BANQUE"
  | "CAISSE"
  | "CHARGES_PERSONNEL"
  | "PERSONNEL_REMUNERATIONS_DUES"
  | "ORGANISMES_SOCIAUX"
  | "DOTATIONS_AMORTISSEMENTS"
  | "AMORTISSEMENTS_CUMULES";

export interface ChartOfAccount {
  id: string;
  companyId: string;
  accountNumber: string;
  label: string;
  classe: string;
  role: AccountRole | null;
  isActive: boolean;
}

export interface CreateAccountInput {
  accountNumber: string;
  label: string;
  role?: AccountRole;
}

export interface UpdateAccountInput {
  label?: string;
  role?: AccountRole | null;
  isActive?: boolean;
}

export interface JournalEntryLineInput {
  accountNumber: string;
  label?: string;
  debit: number;
  credit: number;
}

export interface JournalEntryLine {
  id: string;
  chartOfAccount: ChartOfAccount;
  label: string | null;
  debit: string;
  credit: string;
}

export interface JournalEntry {
  id: string;
  companyId: string;
  journal: JournalType;
  date: string;
  pieceNumber: string;
  label: string;
  sourceType: string | null;
  sourceId: string | null;
  createdBy: { id: string; email: string; fullName: string | null } | null;
  lines: JournalEntryLine[];
}

export interface CreateManualEntryInput {
  journal: JournalType;
  date: string;
  label: string;
  lines: JournalEntryLineInput[];
}

export interface AccountLedgerRow {
  date: string;
  pieceNumber: string;
  label: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface AccountLedger {
  account: ChartOfAccount;
  lines: AccountLedgerRow[];
  finalBalance: number;
}

export interface TrialBalanceLine {
  accountNumber: string;
  label: string;
  debitN: number;
  creditN: number;
  debitN1: number;
  creditN1: number;
}

// ==================== MODULE ACHATS & FOURNISSEURS ====================
// Symétrique du module Facturation (Client/SalesDocument/Payment).

export interface Supplier {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: ClientType;
  address: string | null;
  phone: string | null;
  email: string | null;
  rccm: string | null;
  quality: ClientQuality;
}

export interface SupplierInput {
  name: string;
  type: ClientType;
  address?: string;
  phone?: string;
  email?: string;
  rccm?: string;
  quality: ClientQuality;
}

export type PurchaseDocumentType = "Bon de commande" | "Facture fournisseur";

export interface PurchaseDocumentLine {
  id: string;
  documentId: string;
  productId: string | null;
  designation: string;
  quantity: string;
  unitPriceHT: string;
  observation: string | null;
  lineOrder: number;
}

export interface PurchaseDocumentLineInput {
  productId?: string;
  designation?: string;
  quantity: number;
  unitPriceHT?: number;
  observation?: string;
}

export interface SupplierPayment {
  id: string;
  documentId: string;
  amount: string;
  date: string;
  method: string | null;
  note: string | null;
}

export interface SupplierPaymentInput {
  amount: number;
  date: string;
  method?: string;
  note?: string;
}

export interface PurchaseDocument {
  id: string;
  companyId: string;
  type: PurchaseDocumentType;
  number: string;
  supplierId: string;
  supplier: Supplier;
  date: string;
  status: string;
  tvaRatePercent: string;
  linkedOrderId: string | null;
  createdById: string | null;
  createdBy: { id: string; email: string; fullName: string | null } | null;
  notes: string | null;
  lines: PurchaseDocumentLine[];
  payments: SupplierPayment[];
  totals: DocumentTotals;
  paymentSummary: PaymentSummary | null;
}

export interface CreatePurchaseDocumentInput {
  type: PurchaseDocumentType;
  supplierId: string;
  date: string;
  notes?: string;
  lines: PurchaseDocumentLineInput[];
}

export interface UpdatePurchaseDocumentInput {
  supplierId?: string;
  date?: string;
  notes?: string;
  lines?: PurchaseDocumentLineInput[];
}

// ==================== MODULE CONTRÔLE INTERNE ====================

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export interface AuditLogEntry {
  id: string;
  companyId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityLabel: string;
  summary: string;
  createdAt: string;
  user: { id: string; email: string; fullName: string | null } | null;
}

// ==================== MODULE RAPPROCHEMENT BANCAIRE ====================

export interface BankStatementLine {
  id: string;
  companyId: string;
  date: string;
  label: string;
  amount: string; // signé : positif = crédit, négatif = débit
  reference: string | null;
  matchedEntryId: string | null;
  matchedEntry: TreasuryEntry | null;
  importBatch: string | null;
}

export interface SuggestedMatch {
  statementLineId: string;
  treasuryEntryId: string;
  confidence: "EXACT" | "PROBABLE";
}

export interface ReconciliationSummary {
  bookBalance: number;
  bankStatementBalance: number;
  expectedBankBalance: number;
  gap: number;
  isReconciled: boolean;
  unmatchedStatementLinesCount: number;
  unreconciledBookEntriesCount: number;
}

// ==================== AVENANTS AU CONTRAT DE TRAVAIL ====================

export type AmendmentReason =
  | "Promotion"
  | "Augmentation salariale"
  | "Changement de poste"
  | "Changement de département"
  | "Autre";

export interface ContractAmendment {
  id: string;
  employeeId: string;
  effectiveDate: string;
  reason: AmendmentReason;
  previousPosition: string | null;
  newPosition: string | null;
  previousDepartment: string | null;
  newDepartment: string | null;
  previousGrossSalary: string | null;
  newGrossSalary: string | null;
  previousContractType: string | null;
  newContractType: string | null;
  notes: string | null;
  createdBy: { id: string; email: string; fullName: string | null } | null;
  createdAt: string;
}

export interface CreateAmendmentInput {
  effectiveDate: string;
  reason: AmendmentReason;
  newPosition?: string;
  newDepartment?: string;
  newGrossSalary?: number;
  newContractType?: string;
  notes?: string;
}

// ==================== TABLEAU DE BORD GROUPE (MULTI-ENTREPRISES) ====================

export interface GroupCompanyIndicators {
  companyId: string;
  companyName: string;
  currency: string;
  cashBalance: number;
  revenueYTD: number;
  activeEmployeeCount: number;
}

export interface GroupCurrencyGroup {
  currency: string;
  totalCashBalance: number;
  totalRevenueYTD: number;
  totalActiveEmployeeCount: number;
  companies: GroupCompanyIndicators[];
}

export interface GroupDashboard {
  currencyGroups: GroupCurrencyGroup[];
  companyCount: number;
}

// ==================== CLÔTURE D'EXERCICE COMPTABLE ====================

export interface FiscalYearClosing {
  id: string;
  companyId: string;
  fiscalYear: number;
  closingDate: string;
  netResult: string;
  closingEntryId: string | null;
  closedBy: { id: string; email: string; fullName: string | null } | null;
  closedAt: string;
}

// ==================== SYNTHÈSE TVA ====================

export interface VatSummary {
  totalCollected: number;
  totalDeductible: number;
  netVat: number;
  isCredit: boolean;
  periodStart: string;
  periodEnd: string;
  collectedAccount: { accountNumber: string; label: string };
  deductibleAccount: { accountNumber: string; label: string };
}

// ==================== BUDGET PRÉVISIONNEL DU COMPTE DE RÉSULTAT ====================

export type IncomeBudgetType = "Produit" | "Charge";

export interface IncomeBudgetLine {
  id: string;
  companyId: string;
  fiscalYear: number;
  type: IncomeBudgetType;
  month: number;
  amount: string;
}

export interface IncomeBudgetLineInput {
  fiscalYear: number;
  type: IncomeBudgetType;
  month: number;
  amount: number;
}

export interface MonthlyIncomeComparison {
  month: number;
  budgetRevenue: number;
  budgetExpense: number;
  budgetResult: number;
  actualRevenue: number;
  actualExpense: number;
  actualResult: number;
  revenueVariance: number;
  expenseVariance: number;
  resultVariance: number;
}

export interface IncomeBudgetComparison {
  fiscalYear: number;
  monthlyComparison: MonthlyIncomeComparison[];
  totalBudgetRevenue: number;
  totalBudgetExpense: number;
  totalActualRevenue: number;
  totalActualExpense: number;
}

// ==================== BALANCE ÂGÉE (recouvrement client & échéances fournisseur) ====================

export type AgingBucket = "0-30" | "31-60" | "61-90" | "90+";
export type PartyRiskLevel = "OK" | "ALERTE" | "CRITIQUE";

export interface AgingLine {
  invoiceId: string;
  invoiceNumber: string;
  partyId: string;
  partyName: string;
  daysOverdue: number;
  bucket: AgingBucket;
  remaining: number;
  status: "Impayée" | "Partielle";
}

export interface PartyRiskSummary {
  partyId: string;
  partyName: string;
  invoiceCount: number;
  totalOutstanding: number;
  oldestInvoiceDays: number;
  bucketTotals: Record<AgingBucket, number>;
  riskLevel: PartyRiskLevel;
}

export interface AgingReport {
  lines: AgingLine[];
  byParty: PartyRiskSummary[];
  bucketTotals: Record<AgingBucket, number>;
  totalOutstanding: number;
}

// ==================== JOURNAL DES RÈGLEMENTS ====================

export type PaymentDirection = "Encaissement" | "Décaissement";

export interface PaymentJournalEntry {
  id: string;
  date: string;
  direction: PaymentDirection;
  partyName: string;
  documentNumber: string;
  documentId: string;
  documentType: "SalesDocument" | "PurchaseDocument";
  amount: number;
  method: string | null;
}

// ==================== MESSAGERIE ====================

export type MessageParticipantType = "COMPANY" | "CANDIDATE";

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  companyId: string | null;
  candidateId: string | null;
  lastReadAt: string | null;
  company: { id: string; name: string; logoUrl: string | null } | null;
  candidate: { id: string; fullName: string } | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: MessageParticipantType;
  senderUserId: string | null;
  senderCandidateId: string | null;
  body: string;
  createdAt: string;
  senderUser: { fullName: string | null; email: string } | null;
  senderCandidate: { fullName: string } | null;
}

/** Retour brut de la création/recherche de conversation — sans participants
 * ni messages, la liste les fournit séparément via listConversations. */
export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Forme retournée par la liste des conversations — pas le modèle brut,
 * déjà enrichi côté service (dernier message, non-lu, l'AUTRE participant). */
export interface ConversationListItem {
  id: string;
  updatedAt: string;
  lastMessage: Message | null;
  unread: boolean;
  otherParticipant: ConversationParticipant | undefined;
}

/** Vue admin d'un signalement — contexte complet pour juger (les deux
 * participants de la conversation concernée), pas seulement le motif. */
export interface ConversationReport {
  id: string;
  conversationId: string;
  reporterType: MessageParticipantType;
  reporterUser: { fullName: string | null; email: string } | null;
  reporterCandidate: { fullName: string } | null;
  reason: string;
  createdAt: string;
  resolvedAt: string | null;
  conversation: { participants: ConversationParticipant[] };
}

// ---- Fiscalité ----
export interface TaxSettings {
  id: string;
  companyId: string;
  vatStandardRate: number;
  vatExportRate: number;
  corporateTaxRate: number;
  corporateTaxMinRate: number;
  corporateTaxInstallmentRate: number;
  businessLicenseRate: number;
  socialContribEmployerRate: number;
  socialContribEmployeeRate: number;
  vocationalTrainingRate: number;
  withholdingTaxRate: number;
  incomeTaxAllowanceRate: number;
  incomeTaxBracket1Threshold: number;
  incomeTaxBracket1Rate: number;
  incomeTaxBracket2Threshold: number;
  incomeTaxBracket2Rate: number;
  incomeTaxBracket3Threshold: number;
  incomeTaxBracket3Rate: number;
  incomeTaxBracket4Rate: number;
  corporateTaxMinThreshold: number;
  vatMandatoryThreshold: number;
}

export type TaxSettingsInput = Partial<Omit<TaxSettings, "id" | "companyId">>;

export interface VatMonthSummary {
  month: number; // 0-11
  id: string | null;
  status: "À déclarer" | "Déclarée" | "Payée";
  salesIncTax: number;
  purchasesIncTax: number;
  salesExTax: number;
  vatCollected: number;
  purchasesExTax: number;
  vatDeductible: number;
  netBeforeCredit: number;
  creditCarriedForward: number;
  vatToPay: number;
  newCredit: number;
}

export interface VatMonthInput {
  period: string; // ISO, premier jour du mois
  salesIncTax: number;
  purchasesIncTax: number;
  status?: "À déclarer" | "Déclarée" | "Payée";
}

export interface CorporateTaxSummary {
  id: string | null;
  fiscalYear: number;
  accountingResult: number;
  fiscalReintegrations: number;
  fiscalDeductions: number;
  priorYearLoss: number;
  annualRevenue: number;
  priorYearTax: number;
  taxCredits: number;
  installmentsPaidQ1: number;
  installmentsPaidQ2: number;
  installmentsPaidQ3: number;
  installmentsPaidQ4: number;
  fiscalResult: number;
  calculatedTax: number;
  minimumTax: number;
  taxDue: number;
  netTaxPayable: number;
  quarterlyInstallmentAmount: number;
  totalInstallmentsDue: number;
  totalInstallmentsPaid: number;
  yearEndBalance: number;
}

export type CorporateTaxInput = Omit<
  CorporateTaxSummary,
  | "id"
  | "fiscalResult"
  | "calculatedTax"
  | "minimumTax"
  | "taxDue"
  | "netTaxPayable"
  | "quarterlyInstallmentAmount"
  | "totalInstallmentsDue"
  | "totalInstallmentsPaid"
  | "yearEndBalance"
>;

export interface BusinessLicenseBracket {
  category: string;
  revenueRange: string;
  fixedDuty: number;
  proportionalRate: number;
  activity: string;
}

export interface BusinessLicenseSummary {
  id: string | null;
  fiscalYear: number;
  paid: boolean;
  annualRevenue: number;
  fixedDuty: number;
  proportionalDuty: number;
  totalDue: number;
  latePenalty: number;
  brackets: BusinessLicenseBracket[];
}

export interface BusinessLicenseInput {
  fiscalYear: number;
  annualRevenue: number;
  fixedDuty: number;
  paid?: boolean;
}

export interface PayrollTaxMonthSummary {
  month: number;
  id: string | null;
  paid: boolean;
  grossPayroll: number;
  employerContribution: number;
  employeeContribution: number;
  totalSocialContributions: number;
  vocationalTraining: number;
  totalToPay: number;
  netSalaryPayable: number;
  annualizedPayroll: number;
  incomeTaxAllowance: number;
  netTaxableIncome: number;
  annualIncomeTax: number;
  monthlyIncomeTax: number;
}

export interface PayrollTaxMonthInput {
  period: string;
  grossPayroll: number;
  paid?: boolean;
}

export interface FiscalDeadline {
  month: string;
  taxType: string;
  description: string;
  dueDate: string;
  amount: number;
  legalReference: string;
}

export interface FiscalRecapLine {
  taxType: string;
  base: number;
  amountDue: number;
  legalReference: string;
}

export interface FiscalRecap {
  year: number;
  lines: FiscalRecapLine[];
  totalTaxesAndDues: number;
  taxPressureRate: number;
}

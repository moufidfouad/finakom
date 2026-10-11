import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import PublicLayout from "./components/layout/public/PublicLayout";
import {
  AdminRoute,
  CandidateProtectedRoute,
  ProtectedRoute,
  SuperAdminRoute,
} from "./routes";
import AppLayout from "./components/layout/app/AppLayout";
import ScrollToHash from "./components/common/ScrollToHash";
import PageLoader from "./components/common/PageLoader";

/* Pages publiques */
const LandingPage = lazy(() => import("@/pages/public/LandingPage"));
const AboutPage = lazy(() => import("@/pages/public/AboutPage"));
const ContactPage = lazy(() => import("@/pages/public/ContactPage"));
const JobPostingsPage = lazy(() => import("@/pages/public/JobPostingsPage"));
const JobPostingDetailPage = lazy(
  () => import("@/pages/public/JobPostingDetailPage"),
);
const CvDirectoryPage = lazy(() => import("@/pages/public/CvDirectoryPage"));
const CvDirectoryDetailPage = lazy(
  () => import("@/pages/public/CvDirectoryDetailPage"),
);
const CompanyDirectoryPage = lazy(
  () => import("@/pages/public/CompanyDirectoryPage"),
);
const CompanyDirectoryDetailPage = lazy(
  () => import("@/pages/public/CompanyDirectoryDetailPage"),
);

/* Auth */
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(
  () => import("@/pages/auth/ForgotPasswordPage"),
);
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("@/pages/auth/VerifyEmailPage"));

/* Espace candidat — provider localisé (pas global) : évite un appel réseau
   /candidate-auth/me inutile sur chaque page pour la quasi-totalité des
   visiteurs qui ne sont jamais candidats. */
const CandidateLoginPage = lazy(
  () => import("@/pages/candidateAuth/CandidateLoginPage"),
);
const CandidateRegisterPage = lazy(
  () => import("@/pages/candidateAuth/CandidateRegisterPage"),
);
const CandidateDashboardPage = lazy(
  () => import("@/pages/candidateAuth/CandidateDashboardPage"),
);
const CandidateCvsPage = lazy(
  () => import("@/pages/candidateAuth/CandidateCvsPage"),
);
const CandidateNotificationsPage = lazy(
  () => import("@/pages/candidateAuth/CandidateNotificationsPage"),
);
const CandidateMessagesPage = lazy(
  () => import("@/pages/candidateAuth/CandidateMessagesPage"),
);
const CandidateForgotPasswordPage = lazy(
  () => import("@/pages/candidateAuth/CandidateForgotPasswordPage"),
);
const CandidateResetPasswordPage = lazy(
  () => import("@/pages/candidateAuth/CandidateResetPasswordPage"),
);
const CandidateVerifyEmailPage = lazy(
  () => import("@/pages/candidateAuth/CandidateVerifyEmailPage"),
);

/* Application */
const CompaniesListPage = lazy(() => import("@/pages/app/CompaniesListPage"));
const AccountPage = lazy(() => import("@/pages/app/AccountPage"));
const CompanyDetailPage = lazy(() => import("@/pages/app/CompanyDetailPage"));
const DocumentDetailPage = lazy(() => import("@/pages/app/DocumentDetailPage"));
const PurchaseDocumentDetailPage = lazy(
  () => import("@/pages/app/PurchaseDocumentDetailPage"),
);
const BusinessPlanDetailPage = lazy(
  () => import("@/pages/app/BusinessPlanDetailPage"),
);
const EmployeeDetailPage = lazy(() => import("@/pages/app/EmployeeDetailPage"));
const AnalysisWorkspacePage = lazy(
  () => import("@/pages/app/AnalysisWorkspacePage"),
);
const AdminMessagesPage = lazy(() => import("@/pages/app/AdminMessagesPage"));
const AdminUsersPage = lazy(() => import("@/pages/app/AdminUsersPage"));
const AdminConversationReportsPage = lazy(
  () => import("@/pages/app/AdminConversationReportsPage"),
);
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/annuaire-cv" element={<CvDirectoryPage />} />
            <Route
              path="/annuaire-cv/:cvId"
              element={<CvDirectoryDetailPage />}
            />
            <Route
              path="/annuaire-entreprises"
              element={<CompanyDirectoryPage />}
            />
            <Route
              path="/annuaire-entreprises/:companyId"
              element={<CompanyDirectoryDetailPage />}
            />
            <Route path="/offres" element={<JobPostingsPage />} />
            <Route
              path="/offres/:jobPostingId"
              element={<JobPostingDetailPage />}
            />
            {/* Pages candidates PROTÉGÉES ici (pas les pages de connexion/
                inscription, qui utilisent AuthLayout, pas PublicLayout) :
                elles bénéficient du header partagé (cloche, menu utilisateur). */}
            <Route element={<CandidateProtectedRoute />}>
              <Route
                path="/candidat/tableau-de-bord"
                element={<CandidateDashboardPage />}
              />
              <Route path="/candidat/cv" element={<CandidateCvsPage />} />
              <Route
                path="/candidat/notifications"
                element={<CandidateNotificationsPage />}
              />
              <Route
                path="/candidat/messages"
                element={<CandidateMessagesPage />}
              />
            </Route>

            <Route path="/connexion" element={<LoginPage />} />
            <Route path="/inscription" element={<RegisterPage />} />
            <Route
              path="/mot-de-passe-oublie"
              element={<ForgotPasswordPage />}
            />
            <Route
              path="/reinitialiser-mot-de-passe"
              element={<ResetPasswordPage />}
            />
            <Route path="/verifier-email" element={<VerifyEmailPage />} />

            <Route
              path="/candidat/connexion"
              element={<CandidateLoginPage />}
            />
            <Route
              path="/candidat/inscription"
              element={<CandidateRegisterPage />}
            />
            <Route
              path="/candidat/mot-de-passe-oublie"
              element={<CandidateForgotPasswordPage />}
            />
            <Route
              path="/candidat/reinitialiser-mot-de-passe"
              element={<CandidateResetPasswordPage />}
            />
            <Route
              path="/candidat/verifier-email"
              element={<CandidateVerifyEmailPage />}
            />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<CompaniesListPage />} />
              <Route path="entreprises" element={<CompaniesListPage />} />
              <Route path="mon-compte" element={<AccountPage />} />
              <Route
                path="entreprises/:companyId"
                element={<CompanyDetailPage />}
              />
              <Route
                path="documents/:documentId"
                element={<DocumentDetailPage />}
              />
              <Route
                path="purchase-documents/:documentId"
                element={<PurchaseDocumentDetailPage />}
              />
              <Route
                path="business-plans/:planId"
                element={<BusinessPlanDetailPage />}
              />
              <Route
                path="employes/:employeeId"
                element={<EmployeeDetailPage />}
              />
              <Route
                path="analyses/:analysisId"
                element={<AnalysisWorkspacePage />}
              />

              <Route element={<AdminRoute />}>
                <Route path="admin/messages" element={<AdminMessagesPage />} />
              </Route>
              <Route element={<SuperAdminRoute />}>
                <Route path="admin/users" element={<AdminUsersPage />} />
                <Route
                  path="admin/conversation-reports"
                  element={<AdminConversationReportsPage />}
                />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

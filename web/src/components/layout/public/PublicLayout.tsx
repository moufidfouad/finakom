import { Outlet } from "react-router-dom";
import PublicFooter from "./PublicFooter";
import PublicHeader from "./PublicHeader";
import CandidateAuthProvider from "@/context/CandidateAuthContext";
import ScrollToTopButton from "@/components/common/ScrollToTopButton";

export default function PublicLayout() {
  return (
    <CandidateAuthProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <PublicHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <PublicFooter />
        <ScrollToTopButton />
      </div>
    </CandidateAuthProvider>
  );
}

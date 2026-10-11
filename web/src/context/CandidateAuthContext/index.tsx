import { FC, ReactNode, useEffect, useState } from "react";
import { candidateApiClient } from "@/lib/candidateAxios";
import { Candidate } from "@/types";
import { CandidateAuthContext } from "./context";

const CandidateAuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    candidateApiClient
      .get<Candidate>("/candidate-auth/me")
      .then((res) => setCandidate(res.data))
      .catch(() => setCandidate(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { data } = await candidateApiClient.post<{ candidate: Candidate }>(
      "/candidate-auth/login",
      { email, password },
    );
    setCandidate(data.candidate);
  }

  async function loginWithGoogle(idToken: string) {
    const { data } = await candidateApiClient.post<{ candidate: Candidate }>(
      "/candidate-auth/google",
      { idToken },
    );
    setCandidate(data.candidate);
  }

  async function register(
    email: string,
    password: string,
    fullName: string,
    phone?: string,
  ) {
    const { data } = await candidateApiClient.post<{ candidate: Candidate }>(
      "/candidate-auth/register",
      { email, password, fullName, phone },
    );
    setCandidate(data.candidate);
  }

  async function logout() {
    try {
      await candidateApiClient.post("/candidate-auth/logout");
    } finally {
      setCandidate(null);
    }
  }

  async function refreshProfile() {
    try {
      const { data } =
        await candidateApiClient.get<Candidate>("/candidate-auth/me");
      setCandidate(data);
    } catch {
      setCandidate(null);
    }
  }

  return (
    <CandidateAuthContext.Provider
      value={{
        candidate,
        isLoading,
        isAuthenticated: !!candidate,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </CandidateAuthContext.Provider>
  );
};

export default CandidateAuthProvider;

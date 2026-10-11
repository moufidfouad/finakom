import { Router } from "express";
import { requireCandidateAuth } from "@/middlewares/requireCandidateAuth";
import { rateLimit } from "@/middlewares/rateLimit";
import {
  candidateChangePasswordHandler,
  candidateForgotPasswordHandler,
  candidateGoogleAuthHandler,
  candidateLoginHandler,
  candidateLogoutHandler,
  candidateMeHandler,
  candidateRefreshHandler,
  candidateRegisterHandler,
  candidateRequestVerificationResendHandler,
  candidateResendVerificationHandler,
  candidateResetPasswordHandler,
  candidateVerifyEmailHandler,
} from "./candidateAuth.controller";

const router = Router();

router.post("/register", candidateRegisterHandler);
router.post("/login", candidateLoginHandler);
router.post("/google", candidateGoogleAuthHandler);
router.post("/refresh", candidateRefreshHandler);
router.post("/logout", candidateLogoutHandler); // protégé par le middleware CSRF global
router.get("/me", requireCandidateAuth, candidateMeHandler);

router.put("/password", requireCandidateAuth, candidateChangePasswordHandler);
router.post("/verify-email", candidateVerifyEmailHandler);
router.post(
  "/resend-verification",
  requireCandidateAuth,
  rateLimit(3, 15 * 60 * 1000),
  candidateResendVerificationHandler,
);
router.post(
  "/request-verification",
  rateLimit(5, 15 * 60 * 1000),
  candidateRequestVerificationResendHandler,
);
router.post(
  "/forgot-password",
  rateLimit(5, 15 * 60 * 1000),
  candidateForgotPasswordHandler,
);
router.post("/reset-password", candidateResetPasswordHandler);

export default router;

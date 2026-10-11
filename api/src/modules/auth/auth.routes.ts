import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { rateLimit } from "@/middlewares/rateLimit";
import {
  changePasswordHandler,
  forgotPasswordHandler,
  googleAuthHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
  requestVerificationResendHandler,
  resendVerificationHandler,
  resetPasswordHandler,
  verifyEmailHandler,
} from "./auth.controller";

const router = Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/google", googleAuthHandler);
router.post("/refresh", refreshHandler);
router.post("/logout", logoutHandler); // protégé par le middleware CSRF global (app.ts)
router.get("/me", requireAuth, meHandler);

router.put("/password", requireAuth, changePasswordHandler);
router.post("/verify-email", verifyEmailHandler);
router.post(
  "/resend-verification",
  requireAuth,
  rateLimit(3, 15 * 60 * 1000),
  resendVerificationHandler,
);
router.post(
  "/request-verification",
  rateLimit(5, 15 * 60 * 1000),
  requestVerificationResendHandler,
);
router.post(
  "/forgot-password",
  rateLimit(5, 15 * 60 * 1000),
  forgotPasswordHandler,
);
router.post("/reset-password", resetPasswordHandler);

export default router;

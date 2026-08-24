import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
  updateUserProfile,
  getPendingAdminRequests,
  approveAdminRequest,
  googleAuth,
  getGoogleClientId
} from "../controllers/authControl.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/google-client-id", getGoogleClientId);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", protect, getMe);
router.put("/profile", protect, updateUserProfile);

router.get("/admin-requests", protect, getPendingAdminRequests);
router.put("/admin-requests/:id/approve", protect, approveAdminRequest);

export default router;


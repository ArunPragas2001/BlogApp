import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateUserProfile,
  getPendingAdminRequests,
  approveAdminRequest
} from "../controllers/authControl.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/me", protect, getMe);
router.put("/profile", protect, updateUserProfile);

router.get("/admin-requests", protect, getPendingAdminRequests);
router.put("/admin-requests/:id/approve", protect, approveAdminRequest);

export default router;

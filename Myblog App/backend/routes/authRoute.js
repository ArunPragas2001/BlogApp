import express from "express";
import { registerUser, loginUser, getMe, updateUserProfile } from "../controllers/authControl.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected auth routes (Requires Authorization Header)
router.get("/me", protect, getMe);
router.put("/profile", protect, updateUserProfile);

export default router;

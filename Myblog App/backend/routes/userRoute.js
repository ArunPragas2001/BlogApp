import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getAllUsers, toggleBlockUser, deleteUser, updateUserRole } from "../controllers/userControl.js";

const router = express.Router();

router.get("/", protect, getAllUsers);
router.put("/:id/block", protect, toggleBlockUser);
router.put("/:id/role", protect, updateUserRole);
router.delete("/:id", protect, deleteUser);

export default router;

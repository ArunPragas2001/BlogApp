import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getAllUsers, toggleBlockUser, deleteUser } from "../controllers/userControl.js";

const router = express.Router();

router.get("/", protect, getAllUsers);
router.put("/:id/block", protect, toggleBlockUser);
router.delete("/:id", protect, deleteUser);

export default router;

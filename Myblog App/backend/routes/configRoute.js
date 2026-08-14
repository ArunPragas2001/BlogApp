import express from "express";
import { getSiteConfig, updateSiteConfig } from "../controllers/configControl.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getSiteConfig);
router.put("/", protect, updateSiteConfig);

export default router;

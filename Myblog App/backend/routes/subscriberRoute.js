import express from "express";
import { subscribeUser, getSubscribers } from "../controllers/subscriberControl.js";

const router = express.Router();

router.post("/subscribe", subscribeUser);
router.get("/", getSubscribers);

export default router;

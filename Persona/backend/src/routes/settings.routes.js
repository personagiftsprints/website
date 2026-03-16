import express from "express";
import { getSettings, updateSettings, getPublicSettings } from "../controllers/settings.controller.js";
import { authMiddleware, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route to get non-sensitive settings
router.get("/public", getPublicSettings);

// Admin routes (Protected)
router.get("/", authMiddleware, adminOnly, getSettings);
router.put("/", authMiddleware, adminOnly, updateSettings);

export default router;


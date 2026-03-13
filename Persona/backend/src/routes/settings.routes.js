import express from "express";
import { getSettings, updateSettings, getMaintenanceStatus } from "../controllers/settings.controller.js";
import { authMiddleware, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route to check maintenance status
router.get("/maintenance-status", getMaintenanceStatus);

// Admin routes (Protected)
router.get("/", authMiddleware, adminOnly, getSettings);
router.put("/", authMiddleware, adminOnly, updateSettings);

export default router;


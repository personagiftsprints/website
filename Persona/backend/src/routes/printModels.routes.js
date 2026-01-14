import express from "express"
import {
  getAvailablePrintModels,
  getConfigBySlug,
  updatePrintConfig
} from "../controllers/printarea.controller.js"

const router = express.Router()

// Get all available print models
router.get("/", getAvailablePrintModels)

// Get single print model config by slug
router.get("/info/:slug", getConfigBySlug)
router.put("/info/:slug/:configId", updatePrintConfig)


export default router

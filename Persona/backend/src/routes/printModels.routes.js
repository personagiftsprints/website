import express from "express"
import {
  getAvailablePrintModels,
  getConfigBySlug,
  updatePrintConfig
} from "../controllers/printarea.controller.js"

const router = express.Router()

router.get("/models", getAvailablePrintModels)
router.get("/models/:slug", getConfigBySlug)
router.put("/models/:slug/:configId", updatePrintConfig)

export default router

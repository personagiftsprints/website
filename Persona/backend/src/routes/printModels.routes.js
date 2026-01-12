import express from "express"
import { getAvailablePrintModels } from "../controllers/printarea.controller.js"

const router = express.Router()



router.get("/", getAvailablePrintModels)

export default router

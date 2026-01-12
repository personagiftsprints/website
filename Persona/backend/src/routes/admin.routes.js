import express from "express"
import { stats } from "../controllers/admin.controller.js"
const router = express.Router()

router.get("/stats", stats)

export default router

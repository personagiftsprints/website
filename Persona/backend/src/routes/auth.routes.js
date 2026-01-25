import express from "express"
import {
  emailCheck,
  emailAuth,
  getMe,
  resetPassword,
} from "../controllers/auth.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = express.Router()

router.post("/email/check", emailCheck)
router.post("/email/auth", emailAuth)
router.get("/me", authMiddleware, getMe)
router.post("/password/reset", resetPassword)

export default router

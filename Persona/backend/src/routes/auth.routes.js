import express from "express"
import {
  emailCheck,
  emailAuth,
  getMe,
  googleAuth,
  resetPasswordWithToken,
  requestPasswordReset,
} from "../controllers/auth.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = express.Router()

router.post("/email/check", emailCheck)
router.post("/email/auth", emailAuth)
router.get("/me", authMiddleware, getMe)
router.post("/password/request-reset", requestPasswordReset)
router.post("/password/reset", resetPasswordWithToken)

router.post("/google", googleAuth)

export default router

import express from "express"
import multer from "multer"
import { createOrder } from "../controllers/order.controller.js"
import { optionalAuth } from "../middlewares/optionalAuth.js"

const router = express.Router()

const upload = multer({ dest: "uploads/" })

router.post(
  "/",
  optionalAuth, 
  createOrder
)

export default router

import express from "express"
import {
  getTshirtConfig,
  updateTshirtConfig
} from "../controllers/tshirtConfig.controller.js"

const router = express.Router()

router.get("/tshirt-config/:id", getTshirtConfig)
router.patch("/admin/tshirt-config/:id", updateTshirtConfig)

export default router

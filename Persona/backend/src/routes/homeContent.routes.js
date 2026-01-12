import express from "express"
import {
  getHomeContent,
  updateHomeBanner,
  updateDiscountBanner
} from "../controllers/homeContent.controller.js"
import { bannerUpload } from "../middlewares/upload.js"

const router = express.Router()

router.get("/", getHomeContent)

router.put(
  "/home-banner",
  bannerUpload.single("bannerImage"),
  updateHomeBanner
)

router.put("/discount-banner", updateDiscountBanner)

export default router

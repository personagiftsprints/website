import express from "express"
import {
  getHomeContent,
  updateHomeBanner,
  addHomeBanner,
  deleteHomeBanner,
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

router.post(
  "/home-banners",
  bannerUpload.single("bannerImage"),
  addHomeBanner
)

router.delete("/home-banners/:id", deleteHomeBanner)

router.put("/discount-banner", updateDiscountBanner)

export default router

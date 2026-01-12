import express from "express"
import {
  generateCouponCode,
  createCoupon,
  couponStatus,
  deleteCoupon,
  getAllCoupons,
   applyCoupon
} from "../controllers/coupon.controller.js"

const router = express.Router()

router.get("/generate", generateCouponCode)

router.post("/", createCoupon)

router.patch("/:code/coupon-status", couponStatus)

router.delete("/:code", deleteCoupon)

router.get("/", getAllCoupons)

router.post("/apply", applyCoupon)

export default router

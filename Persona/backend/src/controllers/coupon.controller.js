import Coupon from "../models/Coupon.js"
import { generateCoupon } from "../utils/generateCoupon.js"

export const generateCouponCode = async (_, res) => {
  res.json({ code: generateCoupon() })
}

export const createCoupon = async (req, res) => {
  const coupon = await Coupon.create({
    code: req.body.code,
    discount: req.body.discount,
    expiresAt: req.body.expiresAt,
    isActive: true,
    usedCount: 0
  })

  res.json(coupon)
}

export const couponStatus = async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.params.code })

  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" })
  }

  coupon.isActive = !coupon.isActive
  await coupon.save()

  res.json({
    success: true,
    isActive: coupon.isActive
  })
}

export const deleteCoupon = async (req, res) => {
  const result = await Coupon.deleteOne({ code: req.params.code })

  if (!result.deletedCount) {
    return res.status(404).json({ message: "Coupon not found" })
  }

  res.json({ success: true })
}

export const getAllCoupons = async (_, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 })
  res.json(coupons)
}


export const applyCoupon = async (req, res) => {
  const { code } = req.body

  if (!code) {
    return res.status(400).json({ valid: false, message: "Coupon code required" })
  }

  const coupon = await Coupon.findOne({ code })

  if (!coupon) {
    return res.status(404).json({
      valid: false,
      message: "Invalid coupon code"
    })
  }

  if (!coupon.isActive) {
    return res.status(400).json({
      valid: false,
      message: "Coupon is disabled"
    })
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return res.status(400).json({
      valid: false,
      message: "Coupon has expired"
    })
  }

  res.json({
    valid: true,
    discount: coupon.discount
  })
}

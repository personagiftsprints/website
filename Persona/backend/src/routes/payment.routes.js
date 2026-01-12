import express from "express"
import Stripe from "stripe"
import Product from "../models/Product.js"
import Coupon from "../models/Coupon.js"

const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
console.log("STRIPE KEY:", process.env.STRIPE_SECRET_KEY ? "LOADED" : "MISSING")

router.post("/create-checkout-session", async (req, res) => {
    console.log("Helloo")
      console.log("===== CHECKOUT REQUEST RECEIVED =====")
  console.log("Request body:", JSON.stringify(req.body, null, 2))
  console.log("=====================================")
  try {
    const { mode, cart, productId, qty, couponCode } = req.body

    let subtotal = 0
    let line_items = []

    /* ------------------------
       CART MODE
    -------------------------*/
    if (mode === "cart") {
      for (const item of cart) {
        const product = await Product.findById(item.productId)
        if (!product) continue

        const itemTotal = product.basePrice * item.quantity
        subtotal += itemTotal

        line_items.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              images: [product.images?.[0]]
            },
            unit_amount: product.basePrice * 100
          },
          quantity: item.quantity
        })
      }
    }

    /* ------------------------
       DIRECT MODE
    -------------------------*/
    if (mode === "direct") {
      const product = await Product.findById(productId)
      if (!product) {
        return res.status(404).json({ message: "Product not found" })
      }

      subtotal = product.basePrice * (qty || 1)

      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.images?.[0]]
          },
          unit_amount: product.basePrice * 100
        },
        quantity: qty || 1
      })
    }

    /* ------------------------
       COUPON VALIDATION
    -------------------------*/
    let discountAmount = 0
    let appliedCoupon = null

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode,
        isActive: true,
        expiresAt: { $gt: new Date() }
      })

      if (!coupon) {
        return res.status(400).json({ message: "Invalid or expired coupon" })
      }

      discountAmount = Math.floor(
        (subtotal * coupon.discountPercent) / 100
      )

      appliedCoupon = coupon.code
    }

    const finalAmount = subtotal - discountAmount

    if (finalAmount <= 0) {
      return res.status(400).json({ message: "Invalid payable amount" })
    }

if (line_items.length === 0) {
  return res.status(400).json({ message: "No valid items for checkout" })
}

let session
try {
  session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items,
    success_url: `${process.env.CLIENT_URL}/success`,
    cancel_url: `${process.env.CLIENT_URL}/cart`,
    metadata: {
      coupon: appliedCoupon || "NONE",
      subtotal,
      discountAmount,
      finalAmount
    }
  })
} catch (stripeErr) {
  console.error("STRIPE ERROR ❌", stripeErr)
  return res.status(500).json({ message: stripeErr.message })
}

res.json({ url: session.url })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

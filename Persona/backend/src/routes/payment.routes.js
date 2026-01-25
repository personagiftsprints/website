import express from "express"
import Stripe from "stripe"
import Product from "../models/Product.model.js"
import Coupon from "../models/Coupon.js"

const router = express.Router()

// ✅ MUST use Stripe Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

/* ============================================================
   CREATE CHECKOUT SESSION
============================================================ */
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { mode, cart, couponCode, address, email } = req.body

    if (mode !== "cart" || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: "Invalid cart" })
    }

    const line_items = []

    for (const item of cart) {
      const product = await Product.findById(item.productId)
      if (!product) continue

      const price =
        product.pricing?.specialPrice ??
        product.pricing?.basePrice

      if (!Number.isFinite(price)) {
        return res.status(400).json({ message: "Invalid product price" })
      }

      line_items.push({
        price_data: {
          currency: "usd", // ✅ ALWAYS USD
          product_data: {
            name: product.name,
            images: product.images?.[0]?.url
              ? [product.images[0].url]
              : []
          },
          unit_amount: Math.round(price * 100)
        },
        quantity: item.quantity
      })
    }

    if (!line_items.length) {
      return res.status(400).json({ message: "No valid items" })
    }

    /* -------- COUPON -------- */
    let appliedCoupon = "NONE"
    let stripeDiscounts = []

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode,
        isActive: true,
        expiresAt: { $gt: new Date() }
      })

      if (!coupon || !Number.isFinite(coupon.discount)) {
        return res.status(400).json({ message: "Invalid coupon" })
      }

      const stripeCoupon = await stripe.coupons.create({
        percent_off: coupon.discount,
        duration: "once"
      })

      stripeDiscounts.push({ coupon: stripeCoupon.id })
      appliedCoupon = coupon.code
    }

    /* -------- SESSION PAYLOAD (THIS WAS MISSING) -------- */
    const sessionPayload = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      discounts: stripeDiscounts,
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      metadata: {
        coupon: appliedCoupon,
        cart: JSON.stringify(
          cart.map(i => ({
            productId: String(i.productId),
            quantity: Number(i.quantity),
            configuration: i.configuration ?? null
          }))
        ),
        address: JSON.stringify(address || null)
      }
    }

    // ✅ PREFILL EMAIL IF AVAILABLE
    if (email) {
      sessionPayload.customer_email = email
    }

    const session = await stripe.checkout.sessions.create(sessionPayload)

    res.json({ url: session.url })

  } catch (err) {
    console.error("CHECKOUT ERROR ❌", err)
    res.status(500).json({ message: err.message })
  }
})



export default router

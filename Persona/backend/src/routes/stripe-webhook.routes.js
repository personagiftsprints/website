import express from "express"
import Stripe from "stripe"
import Order from "../models/Order.js"
import Product from "../models/Product.model.js"

const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

router.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"]
  if (!sig) return res.status(400).send("No signature")

  let event
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch {
    return res.status(400).send("Webhook Error")
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object

    const fullSession = await stripe.checkout.sessions.retrieve(
      session.id,
      { expand: ["line_items"] }
    )

    const exists = await Order.findOne({
      checkoutSessionId: fullSession.id
    })

    if (exists) {
      return res.json({ received: true })
    }

    const metadata = fullSession.metadata || {}
    const cart = JSON.parse(metadata.cart || "[]")
    const address = JSON.parse(metadata.address || "null")

    const items = []

    for (const item of cart) {
      const product = await Product.findById(item.productId)
      if (!product) continue

      items.push({
        product: product._id,
        quantity: item.quantity,
        configuration: item.configuration ?? null
      })
    }
    const customerEmail =
  fullSession.customer_email ||
  fullSession.customer_details?.email ||
  null

    await Order.create({
      checkoutSessionId: fullSession.id,
      paymentIntentId: fullSession.payment_intent,
      user: null,
      isGuest: true,
      items,
      address,
      email: customerEmail,

      coupon:
        metadata.coupon && metadata.coupon !== "NONE"
          ? metadata.coupon
          : null,
      total: fullSession.amount_total / 100,
      paymentStatus: "paid"
    })
  }

  res.json({ received: true })
})

export default router

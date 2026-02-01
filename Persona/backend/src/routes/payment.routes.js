import express from "express"
import Stripe from "stripe"
import mongoose from "mongoose"
import Order from "../models/Order.js"
import Coupon from "../models/Coupon.js"
import { optionalAuth } from "../middlewares/optionalAuth.js"
import { sendMail } from "../utils/mailer.js"
import { orderPlacedTemplate } from "../utils/emailTemplates.js"

const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const DELIVERY_THRESHOLD = 100
const DELIVERY_CHARGE = 20

router.post("/create-checkout-session", optionalAuth, async (req, res) => {
  try {
    const { cart, address, email, couponCode } = req.body

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: "Invalid cart" })
    }

    const subtotal = cart.reduce(
      (s, i) => s + (i.price || 0) * (i.quantity || 1),
      0
    )

    let discountPercent = 0
    let appliedCoupon = null

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode,
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      })

      if (coupon) {
        discountPercent = coupon.discount
        appliedCoupon = coupon
      }
    }

    const discountAmount = Math.round((subtotal * discountPercent) / 100)
    const discountedSubtotal = subtotal - discountAmount

    const deliveryCharge =
      discountedSubtotal === 0
        ? 0
        : discountedSubtotal >= DELIVERY_THRESHOLD
        ? 0
        : DELIVERY_CHARGE

    const totalAmount = discountedSubtotal + deliveryCharge

    const itemsPayload = cart.map(item => ({
      productId: new mongoose.Types.ObjectId(item.productId),
      productSnapshot: {
        name: item.name,
        slug: item.slug,
        type: item.type || "other",
        image: item.image,
        finalPrice: Number(item.price)
      },
      variant: item.variant || {},
      quantity: Number(item.quantity) || 1,
      customization: item.customization || { enabled: false }
    }))

    const order = await Order.create({
      user: req.user ? req.user._id : null,
      userType: req.user ? "user" : "guest",
      items: itemsPayload,
      subtotal,
      discount: {
        code: appliedCoupon?.code || null,
        percent: discountPercent,
        amount: discountAmount
      },
      deliveryCharge,
      totalAmount,
      deliveryAddress: {
        fullName: address?.name || "",
        phone: address?.phone || "",
        email: email || address?.email || "",
        addressLine1: address?.line1 || "",
        city: address?.city || "",
        state: address?.state || "",
        postalCode: address?.postcode || "",
        country: address?.country || "US"
      },
      payment: {
        provider: "stripe",
        status: "pending"
      }
    })

    const lineItems = cart.map(item => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.name,
          images: [item.image],
          metadata: { productId: item.productId }
        },
        unit_amount: Math.round(
          (item.price * (100 - discountPercent)) * 100 / 100
        )
      },
      quantity: item.quantity || 1
    }))

    if (deliveryCharge > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: { name: "Delivery Charges" },
          unit_amount: deliveryCharge * 100
        },
        quantity: 1
      })
    }

    let clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").trim()
    if (!clientUrl.startsWith("http")) clientUrl = "http://" + clientUrl
    clientUrl = clientUrl.replace(/\/$/, "")

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${clientUrl}/order/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${clientUrl}/cart`,
      customer_email: email || address?.email || req.user?.email,
      metadata: { orderId: order._id.toString() },
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB"]
      }
    })

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId: order._id
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
})

router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"]

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
    const orderId = session.metadata?.orderId
    if (!orderId) return res.json({ received: true })

    const order = await Order.findById(orderId)
    if (!order || order.payment?.status === "paid") {
      return res.json({ received: true })
    }

    order.orderStatus = "paid"
    order.payment = {
      provider: "stripe",
      paymentId: session.payment_intent,
      status: "paid",
      paidAt: new Date()
    }

    await order.save()

    if (order.discount?.code) {
      await Coupon.updateOne(
        { code: order.discount.code },
        { $inc: { usedCount: 1 } }
      )
    }

    const customerEmail =
      session.customer_email || order.deliveryAddress?.email

    if (customerEmail) {
      console.log("📧 Sending order email to:", customerEmail)

      const orderLink = `${process.env.CLIENT_URL}/order/${order._id}`
      const emailData = orderPlacedTemplate({
        name: order.deliveryAddress?.fullName || "Customer",
        orderId: order.orderNumber,
        total: order.totalAmount.toFixed(2),
        orderLink
      })

      await sendMail({
        to: customerEmail,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html
      })
    }
  }

  res.json({ received: true })
})

export default router

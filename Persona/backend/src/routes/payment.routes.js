import express from "express"
import Stripe from "stripe"
import Order from "../models/Order.js"
import mongoose from "mongoose"
import { optionalAuth } from "../middlewares/optionalAuth.js"

const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Create checkout session
router.post("/create-checkout-session", optionalAuth, async (req, res) => {
  try {
    console.log("👉 RAW BODY:", req.body)
      console.log("🧠 REQ.USER FROM TOKEN:", req.user)

    const { cart, address, email } = req.body

    console.log("👉 CART:", cart)
    console.log("👉 ADDRESS:", address)

    if (!Array.isArray(cart) || cart.length === 0) {
      console.log("❌ CART INVALID")
      return res.status(400).json({ message: "Invalid cart" })
    }

    // Create items payload
    const itemsPayload = cart.map(item => ({
      productId: new mongoose.Types.ObjectId(item.productId),
      productSnapshot: {
        name: String(item.name || ''),
        slug: String(item.slug || ''),
        type: String(item.type || ''),
        image: String(item.image || ''),
        finalPrice: Number(item.price || 0)
      },
      variant: item.variant || { size: null, color: null },
      quantity: Number(item.quantity) || 1,
      customization: item.customization || { enabled: false }
    }))

    // Create order
    const orderPayload = {
      user: req.user ? req.user._id : null,
  userType: req.user ? "user" : "guest",
      items: itemsPayload,
      subtotal: cart.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0),
      totalAmount: cart.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0),
      deliveryAddress: {
        fullName: address?.name || '',
        phone: address?.phone || '',
        addressLine1: address?.line1 || '',
        city: address?.city || '',
        state: address?.state || '',
        postalCode: address?.postcode || '',
        country: address?.country || 'US'
      },
      orderStatus: "created",
      payment: {
        provider: "stripe",
        status: "pending"
      }
    }

    const order = await Order.create(orderPayload)
    console.log("✅ ORDER CREATED:", order._id)

    // Create line items for Stripe
    const lineItems = cart.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.name,
          images: [item.image],
          metadata: {
            productId: item.productId
          }
        },
        unit_amount: Math.round((item.price || 0) * 100),
      },
      quantity: item.quantity || 1,
    }))

    // Get client URL - simplified version
    const getClientUrl = () => {
      let clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
      clientUrl = clientUrl.trim()
      
      // Ensure URL has scheme
      if (!clientUrl.startsWith('http://') && !clientUrl.startsWith('https://')) {
        clientUrl = 'http://' + clientUrl
      }
      
      // Remove trailing slash if present
      clientUrl = clientUrl.replace(/\/$/, '')
      
      console.log("👉 Using Client URL:", clientUrl)
      return clientUrl
    }

    const clientUrl = getClientUrl()

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${clientUrl}/order/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${clientUrl}/cart`,
      metadata: {
        orderId: order._id.toString()
      },
      customer_email: email,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB']
      }
    })

    console.log("✅ Stripe session created:", session.id)

    res.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url,
      orderId: order._id
    })
    
  } catch (err) {
    console.error("❌ Stripe checkout error:", err.message)
    res.status(500).json({ 
      success: false,
      message: err.message
    })
  }
})

// Get order by session ID
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params
    
    // First, try to find order by Stripe session metadata
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (!session.metadata?.orderId) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found for this session" 
      })
    }
    
    const order = await Order.findById(session.metadata.orderId)
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      })
    }
    
    res.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        items: order.items,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt
      }
    })
    
  } catch (err) {
    console.error("❌ Get order error:", err.message)
    res.status(500).json({ 
      success: false,
      message: err.message
    })
  }
})

// Get order by order ID
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params
    
    const order = await Order.findById(orderId)
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      })
    }
    
    res.json({
      success: true,
      order
    })
    
  } catch (err) {
    console.error("❌ Get order error:", err.message)
    res.status(500).json({ 
      success: false,
      message: err.message
    })
  }
})

// Webhook endpoint for Stripe
// ❌ NO express.raw() HERE
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"]

  let event
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // already RAW from server.js
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err.message)
    return res.status(400).send("Webhook Error")
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    const orderId = session.metadata?.orderId

    if (!orderId) return res.json({ received: true })

    const order = await Order.findById(orderId)
    if (!order) return res.json({ received: true })

    // ✅ Idempotent guard
    if (order.payment?.status === "paid") {
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
    console.log(`✅ Order ${order.orderNumber} marked as PAID`)
  }

  res.json({ received: true })
})

// Test endpoint
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Stripe API is working",
    clientUrl: process.env.CLIENT_URL,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY
  })
})

export default router
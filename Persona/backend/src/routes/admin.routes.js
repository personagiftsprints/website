import express from "express"
import { authMiddleware, adminOnly } from "../middlewares/auth.middleware.js"
import User from "../models/User.js"
import Stripe from "stripe"
import Order from "../models/Order.js"
import { getDashboardSummary } from "../controllers/admin.controller.js"
import { sendMail } from "../utils/mailer.js"
import { orderInvoiceTemplate } from "../utils/emailTemplates.js"

// ✅ MUST use Stripe Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const router = express.Router()

router.get("/stats", authMiddleware, adminOnly, async (req, res) => {
  res.json({ status: "success", message: "Admin access granted" })
})


router.get("/users", authMiddleware, adminOnly, async (req, res) => {
  const page = Number(req.query.page) || 1
  const limit = 20
  const skip = (page - 1) * limit
  const q = req.query.q?.trim()

  let filter = {}

  if (q) {
    filter = {
      $or: [
        { _id: q.match(/^[0-9a-fA-F]{24}$/) ? q : undefined },
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ].filter(Boolean),
    }
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ])

  res.json({
    status: "success",
    users,
    pagination: {
      page,
      totalPages: Math.ceil(total / limit),
      total,
    },
  })
})

router.post("/grant-admin", authMiddleware, adminOnly, async (req, res) => {
  const { email, role } = req.body

  const allowedRoles = ["admin", "super_admin", "manager", "moderator"]

  if (!email) {
    return res.status(400).json({ status: "invalid_email" })
  }

  const normalizedRole = role === "superadmin" ? "super_admin" : role;

  if (!allowedRoles.includes(normalizedRole)) {
    return res.status(400).json({ status: "invalid_role" })
  }

  let user = await User.findOne({ email })

  if (!user) {
    return res.status(404).json({ 
      status: "user_not_found", 
      message: "No user account found with this email. The user must create an account first." 
    })
  }

  user.role = normalizedRole
  await user.save()

  res.json({
    status: "success",
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
    },
  })
})

router.get("/admins", authMiddleware, adminOnly, async (req, res) => {
  const admins = await User.find({
    role: { $in: ["admin", "super_admin", "manager", "moderator"] },
  })
    .select("email role createdAt")
    .sort({ createdAt: -1 })

  res.json({ status: "success", admins })
})


router.get("/transactions", async (req, res) => {
  try {
    const limit = 20
    const { starting_after } = req.query

    const sessions = await stripe.checkout.sessions.list({
      limit,
      starting_after: starting_after || undefined
    })
   
    const formatted = sessions.data.map(s => ({
      checkoutSessionId: s.id,
      paymentIntentId: s.payment_intent,
      amount: s.amount_total / 100,
      currency: s.currency,
      status: s.payment_status,
      customerEmail: s.customer_details?.email || null,
      createdAt: new Date(s.created * 1000),
      coupon: s.metadata?.coupon || "NONE"
    }))

    res.json({
      data: formatted,
      hasMore: sessions.has_more,
      nextCursor:
        sessions.has_more
          ? sessions.data[sessions.data.length - 1].id
          : null
    })
  } catch (err) {
    console.error("STRIPE TRANSACTIONS ERROR ❌", err)
    res.status(500).json({ message: err.message })
  }
})

router.get("/transactions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params
 

    const order = await Order.findOne({
      checkoutSessionId: sessionId
    }).populate("items.productId")

    if (!order) {
      return res.status(404).json({ message: "Transaction not found" })
    }

    res.json(order)
  } catch (err) {
    console.error("TRANSACTION DETAIL ERROR ❌", err)
    res.status(500).json({ message: "Failed to load transaction" })
  }
})


/* =====================================================
   ADMIN – GET ALL ORDERS
===================================================== */
router.get(
  "/orders",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const page = Number(req.query.page) || 1
      const limit = 20
      const skip = (page - 1) * limit

      const [orders, total] = await Promise.all([
        Order.find()
          .populate("user", "email role")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Order.countDocuments()
      ])

      res.json({
        success: true,
        orders,
        pagination: {
          page,
          totalPages: Math.ceil(total / limit),
          total
        }
      })
    } catch (err) {
      console.error("ADMIN GET ORDERS ERROR ❌", err)
      res.status(500).json({ message: "Failed to fetch orders" })
    }
  }
)


/* =====================================================
   ADMIN – GET ORDER BY ID
===================================================== */
router.get(
  "/orders/:orderId",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { orderId } = req.params

      const order = await Order.findById(orderId)
        .populate("user", "email role")

      if (!order) {
        return res.status(404).json({ message: "Order not found" })
      }

      res.json({
        success: true,
        order
      })
    } catch (err) {
      console.error("ADMIN GET ORDER ERROR ❌", err)
      res.status(500).json({ message: "Failed to fetch order" })
    }
  }
)


router.patch(
  "/orders/:orderId/status",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { orderId } = req.params
      const { status } = req.body

      const allowedStatuses = [
        "created",
        "paid",
        "processing",
        "printing",
        "shipped",
        "out_for_delivery",
        "cancelled"
      ]

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid order status" })
      }

      const order = await Order.findById(orderId)

      if (!order) {
        return res.status(404).json({ message: "Order not found" })
      }

      order.orderStatus = status
      await order.save()

      res.json({
        success: true,
        order
      })
    } catch (err) {
      console.error("ADMIN UPDATE STATUS ERROR ❌", err)
      res.status(500).json({ message: "Failed to update order status" })
    }
  }
)

router.post(
  "/orders/:orderId/send-invoice",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { orderId } = req.params
      const order = await Order.findById(orderId).populate("user", "email firstName lastName")

      if (!order) {
        return res.status(404).json({ message: "Order not found" })
      }

      const customerEmail = order.user?.email || order.deliveryAddress?.email
      if (!customerEmail) {
        return res.status(400).json({ message: "Customer email not found" })
      }

      const clientUrl = (process.env.CLIENT_BASE_URL || process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
      const orderLink = `${clientUrl}/order/${order._id}`;

      const items = order.items.map(item => ({
        name: item.productSnapshot?.name || "Custom Product",
        quantity: item.quantity,
        price: item.productSnapshot?.finalPrice || 0,
        variant: item.variant ? Object.values(item.variant).filter(Boolean).join(" / ") : ""
      }))

      const emailData = orderInvoiceTemplate({
        name: order.deliveryAddress?.fullName || order.user?.firstName || "Customer",
        orderId: order._id,
        orderNumber: order.orderNumber,
        items,
        subtotal: order.subtotal || 0,
        discount: order.discount?.amount || 0,
        deliveryCharge: order.deliveryCharge || 0,
        total: order.totalAmount,
        status: order.orderStatus,
        orderLink,
        couponCode: order.discount?.code
      })

      await sendMail({
        to: customerEmail,
        ...emailData
      })

      res.json({
        success: true,
        message: "Invoice sent successfully"
      })
    } catch (err) {
      console.error("ADMIN SEND INVOICE ERROR ❌", err)
      res.status(500).json({ message: "Failed to send invoice" })
    }
  }
)


router.get("/dashboard/summary", authMiddleware, adminOnly,getDashboardSummary);


export default router

import express from "express"
import Order from "../models/Order.js"
import { optionalAuth } from "../middlewares/optionalAuth.js"
import { authMiddleware, adminOnly } from "../middlewares/auth.middleware.js"

const router = express.Router()

/* =====================================================
   CREATE ORDER (already handled in payment flow)
===================================================== */
// If you still want manual order creation, keep createOrder here
// router.post("/", optionalAuth, createOrder)

/* =====================================================
   GET ORDERS OF LOGGED-IN USER
===================================================== */
router.get("/my-orders", authMiddleware, async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select("-__v")

  res.json({
    success: true,
    orders
  })
})

/* =====================================================
   GET SINGLE ORDER BY ORDER ID (USER / ADMIN)
===================================================== */
router.get("/:orderId", async (req, res) => {
  const { orderId } = req.params

  const order = await Order.findById(orderId)

  if (!order) {
    return res.status(404).json({ message: "Order not found" })
  }

  

  res.json({
    success: true,
    order
  })
})

/* =====================================================
   GET ORDER BY STRIPE SESSION / PAYMENT ID (SUCCESS PAGE)
===================================================== */
router.get("/session/:sessionId", async (req, res) => {
  const { sessionId } = req.params

  const order = await Order.findOne({
    "payment.paymentId": sessionId
  }).select("orderNumber totalAmount orderStatus createdAt")

  if (!order) {
    return res.status(404).json({ message: "Order not found" })
  }

  res.json({
    success: true,
    order
  })
})

/* =====================================================
   UPDATE ORDER STATUS (ADMIN ONLY)
===================================================== */
router.patch(
  "/:orderId/status",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    const { orderId } = req.params
    const { status } = req.body

    const allowed = [
      "processing",
      "printing",
      "shipped",
      "delivered",
      "cancelled"
    ]

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    order.orderStatus = status
    await order.save()

    res.json({
      success: true,
      orderNumber: order.orderNumber,
      newStatus: status
    })
  }
)

export default router

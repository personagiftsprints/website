import express from "express"
import Order from "../models/Order.js"
import { optionalAuth } from "../middlewares/optionalAuth.js"
import { authMiddleware, adminOnly } from "../middlewares/auth.middleware.js"

const router = express.Router()


const allowedTransitions = {
  paid: ["processing"],
  processing: ["printing", "cancelled"],
  printing: ["out_for_delivery"],
  cancelled: [],
  out_for_delivery: []
}
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



router.patch(
  "/:orderId/status",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { orderId } = req.params
      const { status } = req.body

      const order = await Order.findById(orderId)

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        })
      }

      const currentStatus = order.orderStatus
      const allowed = allowedTransitions[currentStatus] || []

      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid transition from ${currentStatus} to ${status}`
        })
      }

      order.orderStatus = status
      await order.save()

      res.json({
        success: true,
        order
      })
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      })
    }
  }
)

export default router

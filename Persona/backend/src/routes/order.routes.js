import express from "express"
import Order from "../models/Order.js"
import Product from "../models/Product.model.js"
import { optionalAuth } from "../middlewares/optionalAuth.js"
import { authMiddleware, adminOnly } from "../middlewares/auth.middleware.js"

const router = express.Router()


const allowedTransitions = {
  paid: ["processing"],
  processing: ["printing", "cancelled"],
  printing: ["out_for_delivery"],
  cancelled: [],
  out_for_delivery: ["delivered"],
  delivered: []
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
      console.log("Updating order status...")
      const { orderId } = req.params
      const { status } = req.body
      console.log("Updating order status:", orderId, status)

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

      // 📦 Reduce stock if status is "out_for_delivery"
      if (status === "out_for_delivery") {
        console.log("Reducing stock for order:", order.orderNumber)
        for (const item of order.items) {
          try {
            const product = await Product.findById(item.productId)
            if (!product) {
              console.log(`Product ${item.productId} not found for stock reduction`)
              continue
            }

            // If product has variants, find the matching one
            if (product.productConfig?.variants?.length > 0 && item.variant) {
              console.log(`Matching variant for product ${product.name}`, item.variant)
              
              const variantIndex = product.productConfig.variants.findIndex(v => {
                // Handle Mongoose Map or plain object
                const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : v.attributes
                
                // Flexible matching for size and color - normalize to lowercase for comparison
                const itemSize = item.variant?.size?.toString().toLowerCase()
                const itemColor = (item.variant?.color_label || item.variant?.color)?.toString().toLowerCase()
                
                const variantSize = (attrs.size || attrs.Size || attrs.SIZE)?.toString().toLowerCase()
                const variantColor = (attrs.color || attrs.Color || attrs.COLOR)?.toString().toLowerCase()
                
                console.log(`Comparing: Item(size:${itemSize}, color:${itemColor}) vs Variant(size:${variantSize}, color:${variantColor})`)
                
                return variantSize === itemSize && variantColor === itemColor
              })

              if (variantIndex !== -1) {
                const variant = product.productConfig.variants[variantIndex]
                console.log(`Matched variant at index ${variantIndex}. Current stock: ${variant.stockQuantity}`)
                
                if (variant.stockQuantity >= item.quantity) {
                  variant.stockQuantity -= item.quantity
                  variant.soldQuantity = (variant.soldQuantity || 0) + item.quantity
                } else if (variant.stockQuantity > 0) {
                  variant.soldQuantity = (variant.soldQuantity || 0) + variant.stockQuantity
                  variant.stockQuantity = 0
                }
                
                // Explicitly mark as modified for nested updates
                product.markModified('productConfig.variants')
              } else {
                console.log(`No matching variant found for product ${product.name} with attributes:`, item.variant)
              }
            } else if (product.inventory) {
              console.log(`Reducing simple inventory for product ${product.name}. Current stock: ${product.inventory.stockQuantity}`)
              if (product.inventory.stockQuantity >= item.quantity) {
                product.inventory.stockQuantity -= item.quantity
                product.inventory.soldQuantity = (product.inventory.soldQuantity || 0) + item.quantity
              } else if (product.inventory.stockQuantity > 0) {
                product.inventory.soldQuantity = (product.inventory.soldQuantity || 0) + product.inventory.stockQuantity
                product.inventory.stockQuantity = 0
              }
              product.markModified('inventory')
            }

            await product.save()
            console.log(`Stock updated successfully for ${product.name}`)
          } catch (error) {
            console.error(`Failed to update stock for product ${item.productId}:`, error)
          }
        }
      }

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

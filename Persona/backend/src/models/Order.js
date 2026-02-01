import mongoose from "mongoose"

/* ================== ADDRESS ================== */
const addressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    email: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  { _id: false }
)

/* ================== PRODUCT SNAPSHOT ================== */
const productSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    type: { type: String, required: true },
    image: { type: String, required: true },
    finalPrice: { type: Number, required: true }
  },
  { _id: false }
)

/* ================== ORDER ITEM ================== */
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    productSnapshot: {
      type: productSnapshotSchema,
      required: true
    },

    variant: {
      size: String,
      color: String
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    customization: {
      enabled: { type: Boolean, default: false },
      printConfigType: String,
      design: Object
    }
  },
  { _id: false }
)

/* ================== ORDER ================== */
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    userType: {
      type: String,
      enum: ["user", "guest"],
      required: true
    },

    items: {
      type: [orderItemSchema],
      validate: v => Array.isArray(v) && v.length > 0
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    deliveryAddress: addressSchema,

    orderStatus: {
      type: String,
      enum: [
        "created",
        "paid",
        "processing",
        "printing",
        "shipped",
        "delivered",
        "cancelled"
      ],
      default: "created"
    },

    payment: {
      provider: String,
      paymentId: String,
      status: String,
      paidAt: Date
    }
  },
  { timestamps: true }
)

/* ================== ORDER NUMBER ================== */
orderSchema.pre("save", function () {
  if (!this.orderNumber) {
    const ts = Date.now().toString(36).toUpperCase()
    const rand = Math.floor(1000 + Math.random() * 9000)
    this.orderNumber = `ORD-${ts}-${rand}`
  }
})

/* ================== INDEXES ================== */
orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ orderStatus: 1 })
orderSchema.index({ "payment.status": 1 })

export default mongoose.model("Order", orderSchema)

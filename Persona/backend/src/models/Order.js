import mongoose from "mongoose"

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

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },

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

    subtotal: { type: Number, required: true },

    discount: {
      code: String,
      percent: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },

    deliveryCharge: { type: Number, default: 0 },

    totalAmount: { type: Number, required: true },

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

orderSchema.pre("save", function () {
  if (!this.orderNumber) {
    const ts = Date.now().toString(36).toUpperCase()
    const rand = Math.floor(1000 + Math.random() * 9000)
    this.orderNumber = `ORD-${ts}-${rand}`
  }
})

export default mongoose.model("Order", orderSchema)

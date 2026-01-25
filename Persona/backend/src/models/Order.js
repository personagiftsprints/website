import mongoose from "mongoose"

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    isGuest: {
      type: Boolean,
      default: false
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: {
          type: Number,
          required: true
        },
        configuration: {
          type: Object,
          default: null
        }
      }
    ],

    address: {
      name: String,
      phone: String,
      line1: String,
      city: String,
      state: String,
      postcode: String,
      country: String
    },

    coupon: String,

    total: {
      type: Number,
      required: true
    },

    paymentIntentId: {
      type: String,
      required: true
    },
     checkoutSessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    paymentStatus: {
      type: String,
      enum: ["paid", "failed"],
      default: "paid"
    }
  },
  { timestamps: true }
)

export default mongoose.model("Order", OrderSchema)

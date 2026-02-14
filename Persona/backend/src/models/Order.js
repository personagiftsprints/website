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
    productType: { type: String, required: true, enum: ["tshirt", "mug", "hoodie", "other"] },
    image: { type: String, required: true },
    finalPrice: { type: Number, required: true }
  },
  { _id: false }
)

// 🎯 T-shirt specific customization schema
const tshirtCustomizationSchema = new mongoose.Schema(
  {
    model_id: String,
    print_config_id: String,
    color: String,
    size: String,
    view_configuration: {
      show_center_chest: Boolean,
      show_left_chest: Boolean,
      current_view: String
    },
    print_areas: {
      type: Map,
      of: new mongoose.Schema({
        enabled: Boolean,
        area: String,
        orientation_id: String,
        view: String,
        image: {
          url: String,
          width: Number,
          height: Number,
          source: String,
          position: {
            x: Number,
            y: Number,
            scale: Number,
            rotate: Number
          }
        }
      }, { _id: false })
    },
    // Store all Cloudinary URLs for reference
    cloudinary_urls: {
      type: Map,
      of: String
    },
    // Store the final composite preview image
    preview_image_url: String,
    // Store original uploaded image references
    uploaded_images: [{
      area_id: String,
      area_name: String,
      view: String,
      local_url: String,
      cloudinary_url: String
    }],
    metadata: {
      design_timestamp: Date,
      image_positions: mongoose.Schema.Types.Mixed
    }
  },
  { _id: false }
)

// 📦 Generic customization wrapper for different product types
const customizationDataSchema = new mongoose.Schema(
  {
    productType: { 
      type: String, 
      enum: ["tshirt", "mug", "hoodie", "poster", "other"],
      required: true 
    },
    // T-shirt specific data
    tshirt: tshirtCustomizationSchema,
    // Future product types
    mug: mongoose.Schema.Types.Mixed,
    hoodie: mongoose.Schema.Types.Mixed,
    // Generic fallback
    other: mongoose.Schema.Types.Mixed
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
      color: String,
      color_label: String
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    // 🔥 NEW: Store complete customization data
    customization: {
      enabled: { type: Boolean, default: false },
      type: { 
        type: String,
        enum: ["tshirt", "mug", "hoodie", "none"],
        default: "none"
      },
      data: customizationDataSchema
    },
    // 👇 DEPRECATED - keep for backward compatibility
    designData: {
      type: mongoose.Schema.Types.Mixed,
      default: null
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
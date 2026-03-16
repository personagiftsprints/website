import mongoose from "mongoose"

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },

    addressLine1: { type: String, required: true },
    addressLine2: { type: String },

    town: { type: String, required: true },
    county: { type: String },

    postcode: { type: String, required: true },

    countryCode: {
      type: String,
      default: "GB"
    }
  },
  { _id: false }
)


const productSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    productType: { type: String, required: true, enum: ["tshirt", "mug", "hoodie", "other","normal","mobileCase","frame","3Dcrystal"] },
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
       text_layers: Object,        // Store text content and styling
          text_positions: Object,     // Store text positioning
          text_content: Object,  
    

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
      image_positions: mongoose.Schema.Types.Mixed,
       text_positions: Object,    // Also store in metadata
            text_summary: Array  
    }
  },
  { _id: false }
)

// Add to customizationDataSchema (optional, not required)
const customizationDataSchema = new mongoose.Schema(
  {
    productType: { 
      type: String, 
      enum: ["tshirt", "mug", "hoodie", "poster", "other","normal","mobileCase","frame","3Dcrystal"],
      required: true 
    },
    // T-shirt specific data
    tshirt: tshirtCustomizationSchema,
    // Future product types
    mug: mongoose.Schema.Types.Mixed,
    hoodie: mongoose.Schema.Types.Mixed,
    // Custom fields products
    custom_fields: {
      type: {
        fields: Array,
        data: mongoose.Schema.Types.Mixed,
        uploaded_images: mongoose.Schema.Types.Mixed,
        field_count: {
          images: Number,
          texts: Number
        }
      },
      default: null
    },
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
        enum: ["tshirt", "mug", "hoodie", "normal","mobileCase","frame","3Dcrystal","other"],
        default: "none"
      },

       customizationType: { 
        type: String,
        enum: ['print_config', 'custom_fields', 'none'],
        default: 'none'
      },
      data: customizationDataSchema
    },
      data: customizationDataSchema,
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
    checkoutSessionId: {
  type: String,
  index: true
},


   orderStatus: {
  type: String,
  enum: [
    "created",
    "paid",
    "processing",
    "printing",
    "cancelled",
    "out_for_delivery",
    "delivered"
  ],
  default: "processing"
},
packaging: {
  hamper: { type: String, default: null },
  hamperCharge: { type: Number, default: 0 },
  giftWrap: { type: Boolean, default: false },
  giftWrapCharge: { type: Number, default: 0 }
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
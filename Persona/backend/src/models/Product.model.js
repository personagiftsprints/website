import mongoose from 'mongoose'

/* ---------------- IMAGE ---------------- */
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    name: String,
    isMain: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    altText: String
  },
  { _id: false }
)



const customFieldSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['image', 'text']
    },
    label: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    required: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    },
    // For image fields
    imageConstraints: {
      maxSize: { type: Number, default: 5 },
      allowedFormats: { type: [String], default: ['jpg', 'png', 'webp'] },
      minWidth: Number,
      maxWidth: Number,
      minHeight: Number,
      maxHeight: Number
    },
    // For text fields
    textConstraints: {
      maxLength: Number,
      minLength: Number,
      placeholder: String
    }
  },
  { _id: false }
);

/* ---------------- PRICING ---------------- */
const pricingSchema = new mongoose.Schema(
  {
    basePrice: { type: Number, required: true, min: 0 },
    specialPrice: { type: Number, required: false, min: 0 },
    currency: { type: String, default: 'GBP' },
    taxInclusive: { type: Boolean, default: true },
    discountPercentage: { type: Number, min: 0, max: 100, default: 0 }
  },
  { _id: false }
)

/* ---------------- INVENTORY ---------------- */
const inventorySchema = new mongoose.Schema(
  {
  
    stockQuantity: { type: Number, default: 0, min: 0 },
    manageStock: { type: Boolean, default: false },
    allowBackorder: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 10 },
    soldQuantity: { type: Number, default: 0 }
  },
  { _id: false }
)

/* ---------------- PRODUCT CONFIG ---------------- */
const productConfigSchema = new mongoose.Schema(
  {
    attributes: [
      {
        code: { type: String, required: true },
        name: { type: String, required: true },
        values: [{ type: String, required: true }]
      }
    ],
    variants: [
      {
       
        attributes: {
          type: Map,
          of: String,
          required: true
        },
        stockQuantity: { type: Number, required: true, min: 0 },
        soldQuantity: { type: Number, default: 0 },
        priceOverride: { type: Number }
      }
    ]
  },
  { _id: false }
)


/* ---------------- PRODUCT ---------------- */
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    sku: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true
},
    type: {
      type: String,
      required: true,
      enum: [
        'tshirt',
        'mug',
        'mobileCase',
        'hoodie',
        'poster',
        'frame',
        'sticker',
        'hat',
        'normal',
        '3Dcrystal',
        'other'
      ]
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory'
    },
    productConfig: {
  type: productConfigSchema,
  default: null
},
 customizationType: {
      type: String,
      enum: ['print_config', 'custom_fields', 'none'],
      default: 'none'
    },
customFields: [customFieldSchema],

    description: String,
    material: String,
    isActive: { type: Boolean, default: true },
   

    images: [imageSchema],
    thumbnail: String,

    pricing: { type: pricingSchema, required: true },
    inventory: inventorySchema,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    customization: {
      enabled: { type: Boolean, default: false },
      printConfig: {
        configId: mongoose.Schema.Types.ObjectId,
        configName: String,
        configType: String
      }
    }
  },
  { timestamps: true }
)

/* ---------------- PRE SAVE ---------------- */
productSchema.pre('save', function () {
  const mainImage = this.images.find(i => i.isMain)
  this.thumbnail = mainImage?.url || this.images[0]?.url || null

  // Fix: handle optional specialPrice and ensure it's lower than basePrice for discount
  if (
    this.pricing?.specialPrice &&
    this.pricing.specialPrice > 0 &&
    this.pricing.basePrice > this.pricing.specialPrice
  ) {
    this.pricing.discountPercentage = Math.round(
      ((this.pricing.basePrice - this.pricing.specialPrice) /
        this.pricing.basePrice) *
        100
    )
  } else {
    this.pricing.discountPercentage = 0
  }
})


// productSchema.index({ slug: 1 })

// productSchema.index({ sku: 1 }, { unique: true })
// productSchema.index({ 'productConfig.variants.sku': 1 }, { unique: true, sparse: true })
productSchema.index({ type: 1, isActive: 1 })

export default mongoose.model('Product', productSchema)

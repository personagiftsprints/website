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

/* ---------------- PRICING ---------------- */
const pricingSchema = new mongoose.Schema(
  {
    basePrice: { type: Number, required: true, min: 0 },
    specialPrice: { type: Number, min: 0 },
    currency: { type: String, default: 'USD' },
    taxInclusive: { type: Boolean, default: true },
    discountPercentage: { type: Number, min: 0, max: 100, default: 0 }
  },
  { _id: false }
)

/* ---------------- INVENTORY ---------------- */
const inventorySchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true, sparse: true },
    stockQuantity: { type: Number, default: 0, min: 0 },
    manageStock: { type: Boolean, default: false },
    allowBackorder: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 10 },
    soldQuantity: { type: Number, default: 0 }
  },
  { _id: false }
)

/* ---------------- PRODUCT ---------------- */
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    type: {
      type: String,
      required: true,
      enum: [
        'tshirt',
        'mug',
        'mobileCase',
        'hoodie',
        'poster',
        'pillow',
        'sticker',
        'hat',
        'other'
      ]
    },

    description: String,
    material: String,
    isActive: { type: Boolean, default: true },
   

    images: [imageSchema],
    thumbnail: String,

    pricing: { type: pricingSchema, required: true },
    inventory: inventorySchema,

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

  if (
    this.pricing?.specialPrice &&
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

/* ---------------- INDEXES ---------------- */
productSchema.index({ slug: 1 })
productSchema.index({ type: 1, isActive: 1 })

export default mongoose.model('Product', productSchema)

import Joi from 'joi'

export const productSchema = Joi.object({
  basicInfo: Joi.object({
    name: Joi.string().min(3).max(200).required(),
    slug: Joi.string().min(3).max(100).pattern(/^[a-z0-9-]+$/).required(),
    type: Joi.string().valid(
      'tshirt', 'mug', 'mobileCase', 'hoodie',
      'poster', 'pillow', 'sticker', 'hat', 'other'
    ).required(),
    description: Joi.string().max(2000).allow(''),
    material: Joi.string().max(100).allow(''),
    isActive: Joi.boolean().default(true),
    status: Joi.string().valid('draft', 'published', 'archived').default('draft')
  }).required(),

  pricing: Joi.object({
    basePrice: Joi.number().min(0).required(),
    specialPrice: Joi.number().min(0).allow(null),
    currency: Joi.string().default('USD'),
    taxInclusive: Joi.boolean().default(true)
    // Removed discountPercentage — let backend calculate it
  }).required(),

  media: Joi.object({
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        name: Joi.string(),
        isMain: Joi.boolean().default(false),
        order: Joi.number().min(0),
        altText: Joi.string()
      })
    ).max(5).default([]),
    thumbnail: Joi.string().uri().allow(null)
    // Removed gallery field completely
  }).required(),

  customization: Joi.object({
    enabled: Joi.boolean().default(false),
    printConfig: Joi.object({
      configId: Joi.string().allow(''),
      configName: Joi.string().allow(''),
      configType: Joi.string().valid('general', 'views', 'models')
        .default('views')  // ← default to 'views' so t-shirt/mug/etc work
    }).allow(null),
    views: Joi.array().items(Joi.object()).default([])
  }).required(),

  metadata: Joi.object({
    seoTitle: Joi.string().max(200).allow(''),
    seoDescription: Joi.string().max(500).allow(''),
    keywords: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.string())
  }).required(),

  inventory: Joi.object({
    sku: Joi.string().required(),
    stockQuantity: Joi.number().min(0).default(0),
    manageStock: Joi.boolean().default(false),
    allowBackorder: Joi.boolean().default(false),
    lowStockThreshold: Joi.number().min(0).default(10),
    trackInventory: Joi.boolean().default(false)
  }).required()

  // shipping field is completely removed
  // No longer present → no validation error will occur
})

export const validateProductData = (req, res, next) => {
  const { error } = productSchema.validate(req.body, { 
    abortEarly: false,
    allowUnknown: false   // ← prevents extra unknown fields
  })

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    })
  }

  next()
}
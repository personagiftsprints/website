
import Product from '../models/Product.model.js'
import { PRODUCT_TYPE_ATTRIBUTES } from '../constants/productAttributes.js'
const generateSku = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let sku = ''
  for (let i = 0; i < 6; i++) {
    sku += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return sku
}
export const getProductAttributesByType = (req, res) => {
  const { type } = req.params

  const attributes = PRODUCT_TYPE_ATTRIBUTES[type]

  if (!attributes) {
    return res.status(404).json({
      success: false,
      message: 'No attributes defined for this product type'
    })
  }

  res.json({
    success: true,
    data: attributes
  })
}


export const getSimilarProducts = async (req, res) => {

  try {
    const product = await Product.findOne({
      type: req.params.type,
      isActive: true
    })

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      })
    }

    

    const similar = await Product.find({
      type: product.type,
      _id: { $ne: product._id },
      isActive: true
    })
      .limit(8)
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: similar
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
}


export const createProduct = async (req, res) => {
  try {
    const {
      basicInfo,
      pricing,
      inventory,
      customization,
      images,
      productConfig,

      name,
      slug,
      type,
      description,
      material,
      isActive
    } = req.body

    const finalBasicInfo = basicInfo || {
      name,
      slug,
      type,
      description,
      material,
      isActive
    }

    if (!finalBasicInfo?.name || !finalBasicInfo?.slug || !finalBasicInfo?.type) {
      return res.status(400).json({
        success: false,
        message: 'Name, slug, and type are required'
      })
    }

const generateUniqueSku = async () => {
  let sku
  let exists = true

  while (exists) {
    sku = generateSku()

    exists = await Product.exists({ sku })
  }

  return sku
}
    const exists = await Product.findOne({ slug: finalBasicInfo.slug })
   
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Slug already exists'
      })
    }

    const hasVariants =
      productConfig?.variants &&
      productConfig.variants.length > 0

    if (hasVariants && inventory?.manageStock) {
      return res.status(400).json({
        success: false,
        message: 'Disable base inventory when using variants'
      })
    }

    /* ---------------- VARIANT VALIDATION + MAP FIX ---------------- */

  if (hasVariants) {
  const allowedAttributes =
    PRODUCT_TYPE_ATTRIBUTES[finalBasicInfo.type] || []

  const allowedCodes = allowedAttributes.map(a => a.code)
  const seen = new Set()

  productConfig.variants = await Promise.all(
    productConfig.variants.map(async (variant) => {

      const attrMap = new Map(variant.attributes)

      for (const key of attrMap.keys()) {
        if (!allowedCodes.includes(key)) {
          throw new Error(`Invalid attribute "${key}" for product type`)
        }
      }

      const signature = JSON.stringify([...attrMap.entries()].sort())
      if (seen.has(signature)) {
        throw new Error('Duplicate variant combination detected')
      }
      seen.add(signature)

      const variantSku = await generateUniqueSku()

      return {
        ...variant,
      
        attributes: attrMap,
        stockQuantity: Number(variant.stockQuantity) || 0,
        soldQuantity: 0
      }
    })
  )
}

const parentSku = await generateUniqueSku()

    /* ---------------- CREATE PRODUCT ---------------- */

    const product = await Product.create({
      ...finalBasicInfo,
      pricing,
       sku:parentSku,
      inventory: hasVariants ? { manageStock: false } : inventory,
      productConfig: hasVariants ? productConfig : null,
      customization,
      images
    })

    res.status(201).json({
      success: true,
      data: product
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}



export const getProductBySku = async (req, res) => {
  try {
    const { sku } = req.params

    if (!sku) {
      return res.status(400).json({
        success: false,
        message: "SKU is required"
      })
    }

    const normalizedSku = sku.toUpperCase()

    const product = await Product.findOne({
      $or: [
        { sku: normalizedSku },
        { 'productConfig.variants.sku': normalizedSku }
      ]
    }).populate('customization.printConfig.configId')

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      })
    }

    let matchedVariant = null

    if (product.productConfig?.variants?.length > 0) {
      matchedVariant = product.productConfig.variants.find(
        v => v.sku === normalizedSku
      )
    }

    res.json({
      success: true,
      data: {
        product,
        matchedVariant,
        isVariant: !!matchedVariant
      }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}


export const getAllProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const skip = (page - 1) * limit

    const { search, type, isActive } = req.query

    const filter = {}

    if (type) {
      filter.productType = type
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true"
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } }
      ]
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter)
    ])

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Get all products error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch products"
    })
  }
}

// 3. Get single product by ID (with full populated config)
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('customization.printConfig.configId')

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    res.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    })
  }
}

// 4. Get product by slug (public-facing, with population)
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ 
      slug: req.params.slug,
      isActive: true 
    }).populate('customization.printConfig.configId')

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive'
      })
    }

    res.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Get product by slug error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    })
  }
}

// 5. Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    if (updates.basicInfo?.slug) {
      const existing = await Product.findOne({
        slug: updates.basicInfo.slug,
        _id: { $ne: id }
      })
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Slug already exists'
        })
      }
    }

    const updatePayload = {}

    if (updates.basicInfo) {
      Object.assign(updatePayload, updates.basicInfo)
    } else {
      Object.assign(updatePayload, updates)
    }

    if (updates.productConfig?.variants?.length > 0) {
      updatePayload.inventory = { manageStock: false }
      updatePayload.productConfig = updates.productConfig
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    )

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    res.json({
      success: true,
      data: product
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}


export const getLandingProducts = async (req, res) => {
  try {
    const [trending, tshirts, mugs,mobileCase,normal] = await Promise.all([
      Product.find({ isActive: true })
        .sort({ 'inventory.soldQuantity': -1 })
        .limit(10)
        .select('name slug thumbnail pricing type'),

      Product.find({ isActive: true, type: 'tshirt' })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name slug thumbnail pricing'),

      Product.find({ isActive: true, type: 'mug' })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name slug thumbnail pricing'),
     Product.find({ isActive: true, type: 'mobileCase' })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name slug thumbnail pricing'),
    Product.find({ isActive: true, type: 'normal' })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name slug thumbnail pricing'),

      Product.find({ isActive: true, type: 'hoodie' })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name slug thumbnail pricing'),

      Product.find({ isActive: true, type: '3Dcrystal' })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name slug thumbnail pricing'),
        Product.find({ isActive: true, type: 'frame' })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name slug thumbnail pricing')
    ])

    

    return res.status(200).json({
      success: true,
      data: {
        trending,
        tshirts,
        mugs,
        normal,mobileCase
        
      }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch landing products',
      error: error.message
    })
  }
}


// 6. Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    })
  }
}

// 7. Toggle active/inactive status
export const toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    product.isActive = !product.isActive
    await product.save()

    res.json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'}`,
      data: product
    })
  } catch (error) {
    console.error('Toggle status error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to toggle status',
      error: error.message
    })
  }
}


export const getProductsByType = async (req, res) => {
  try {
    const { type } = req.params
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const skip = (page - 1) * limit

    const filter = {
      type,
      isActive: true
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter)
    ])

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Get products by type error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch products by type"
    })
  }
}


export const getStockManagement = async (req, res) => {
  try {
    const { sku, lowStock } = req.query
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const skip = (page - 1) * limit

    const matchStage = {}

    if (sku) {
      matchStage.sku = sku.toLowerCase()
    }

    const basePipeline = [
      { $match: matchStage },

      {
        $addFields: {
          variantCount: {
            $size: { $ifNull: ['$productConfig.variants', []] }
          },
          totalVariantStock: {
            $sum: {
              $map: {
                input: { $ifNull: ['$productConfig.variants', []] },
                as: 'v',
                in: '$$v.stockQuantity'
              }
            }
          }
        }
      },

      {
        $addFields: {
          displayStock: {
            $cond: {
              if: { $gt: ['$variantCount', 0] },
              then: '$totalVariantStock',
              else: '$inventory.stockQuantity'
            }
          }
        }
      },

      {
        $addFields: {
          isLowStock: {
            $lte: [
              '$displayStock',
              '$inventory.lowStockThreshold'
            ]
          }
        }
      }
    ]

    if (lowStock === 'true') {
      basePipeline.push({ $match: { isLowStock: true } })
    }

    const dataPipeline = [
      ...basePipeline,
      { $sort: { displayStock: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          name: 1,
          sku: 1,
          type: 1,
          displayStock: 1,
          variantCount: 1,
          isLowStock: 1
        }
      }
    ]

    const data = await Product.aggregate(dataPipeline)

    const countPipeline = [
      ...basePipeline,
      { $count: 'total' }
    ]

    const totalResult = await Product.aggregate(countPipeline)
    const total = totalResult[0]?.total || 0

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
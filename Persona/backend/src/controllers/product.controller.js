
import Product from '../models/Product.model.js'
import { PRODUCT_TYPE_ATTRIBUTES } from '../constants/productAttributes.js'

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

      productConfig.variants = productConfig.variants.map(variant => {
        // Convert attributes array -> Map
        const attrMap = new Map(variant.attributes)

        // Validate attribute codes
        for (const key of attrMap.keys()) {
          if (!allowedCodes.includes(key)) {
            throw new Error(`Invalid attribute "${key}" for product type`)
          }
        }

        // Prevent duplicate variant combinations
        const signature = JSON.stringify([...attrMap.entries()].sort())
        if (seen.has(signature)) {
          throw new Error('Duplicate variant combination detected')
        }
        seen.add(signature)

        return {
          ...variant,
          attributes: attrMap,
          stockQuantity: Number(variant.stockQuantity) || 0,
          soldQuantity: 0
        }
      })
    }

    /* ---------------- CREATE PRODUCT ---------------- */

    const product = await Product.create({
      ...finalBasicInfo,
      pricing,
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






// 2. Get all products (paginated + filters + populated config)
export const getAllProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const skip = (page - 1) * limit

    const filter = {} // admin: include active + inactive

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
    const [trending, tshirts, mugs, hoodies] = await Promise.all([
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

      Product.find({ isActive: true, type: 'hoodie' })
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
        hoodies
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

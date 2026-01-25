
import Product from '../models/Product.model.js'


export const createProduct = async (req, res) => {
  try {
    const {
      basicInfo,
      pricing,
      inventory,
      customization,
      images
    } = req.body

    if (!basicInfo?.name || !basicInfo?.slug || !basicInfo?.type) {
      return res.status(400).json({
        success: false,
        message: 'Name, slug, and type are required'
      })
    }

    const exists = await Product.findOne({ slug: basicInfo.slug })
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Slug already exists'
      })
    }

    const product = await Product.create({
      ...basicInfo,
      pricing,
      inventory,
      customization,
      images
    })

    return res.status(201).json({
      success: true,
      data: product
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
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

    // Prevent duplicate slug
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

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('customization.printConfig.configId')

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
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

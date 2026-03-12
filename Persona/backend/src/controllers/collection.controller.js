import Collection from "../models/Collection.js"
import Product from "../models/Product.model.js"
import slugify from "slugify"

export const createCollection = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      productTypes,
      productIds,
      image
    } = req.body

    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: "Title and type are required"
      })
    }

    const existing = await Collection.findOne({ title })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Collection already exists"
      })
    }

    if (type === "MANUAL" && (!productIds || !productIds.length)) {
      return res.status(400).json({
        success: false,
        message: "Select at least one product"
      })
    }

    if (type === "PRODUCT_TYPE" && (!productTypes || !productTypes.length)) {
      return res.status(400).json({
        success: false,
        message: "Select at least one product type"
      })
    }

    if (type === "MANUAL") {
      const validProducts = await Product.countDocuments({
        _id: { $in: productIds }
      })

      if (validProducts !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: "Invalid product selection"
        })
      }
    }

    const collection = await Collection.create({
      title,
      description,
      type,
      productTypes: type === "PRODUCT_TYPE" ? productTypes : [],
      productIds: type === "MANUAL" ? productIds : [],
      image
    })

    res.status(201).json({
      success: true,
      data: collection
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export  const getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 })

    res.json({
      success: true,
      data: collections
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getActiveCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ isActive: true }).sort({ createdAt: -1 })

    res.json({
      success: true,
      data: collections
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params

    const collection = await Collection.findById(id)

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found"
      })
    }

    let products = []

    /* ================= PRODUCT_TYPE MODE ================= */

    if (collection.type === "PRODUCT_TYPE") {
      products = await Product.find({
        type: { $in: collection.productTypes },
        isActive: true
      }).sort({ createdAt: -1 })
    }

    /* ================= MANUAL MODE ================= */

    if (collection.type === "MANUAL") {
      products = await Product.find({
        _id: { $in: collection.productIds },
        isActive: true
      }).sort({ createdAt: -1 })
    }

    return res.json({
      success: true,
      data: {
        ...collection.toObject(),
        products
      }
    })

  } catch (error) {
    console.error("Get collection error:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch collection"
    })
  }
}

export const updateCollection = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      productTypes,
      productIds,
      image,
      isActive
    } = req.body

    const collection = await Collection.findById(req.params.id)

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found"
      })
    }

    if (title && title !== collection.title) {
      const existing = await Collection.findOne({ title })
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Collection title already exists"
        })
      }
    }

    if (type === "MANUAL" && (!productIds || !productIds.length)) {
      return res.status(400).json({
        success: false,
        message: "Select at least one product"
      })
    }

    if (type === "PRODUCT_TYPE" && (!productTypes || !productTypes.length)) {
      return res.status(400).json({
        success: false,
        message: "Select at least one product type"
      })
    }

    if (type === "MANUAL") {
      const validProducts = await Product.countDocuments({
        _id: { $in: productIds }
      })

      if (validProducts !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: "Invalid product selection"
        })
      }
    }

    collection.title = title ?? collection.title
    collection.description = description ?? collection.description
    collection.type = type ?? collection.type
    collection.productTypes =
      type === "PRODUCT_TYPE" ? productTypes : []
    collection.productIds =
      type === "MANUAL" ? productIds : []
    collection.image = image ?? collection.image
    collection.isActive =
      typeof isActive === "boolean" ? isActive : collection.isActive

    await collection.save()

    res.json({
      success: true,
      data: collection
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found"
      })
    }

    await collection.deleteOne()

    res.json({
      success: true,
      message: "Collection deleted successfully"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const toggleCollectionStatus = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found"
      })
    }

    collection.isActive = !collection.isActive
    await collection.save()

    res.json({
      success: true,
      data: collection
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
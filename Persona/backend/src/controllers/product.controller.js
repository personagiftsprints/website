import Product from "../models/Product.model.js"
import TshirtPrintConfig from "../models/print/TshirtPrintConfig.model.js"

export const initProduct = async (req, res) => {
  const { type } = req.body

  if (type !== "tshirt") {
    return res.status(400).json({ message: "Unsupported product type" })
  }

  const defaultConfig = await TshirtPrintConfig.findOne({ isDefault: true }).lean()

  if (!defaultConfig) {
    return res.status(500).json({ message: "Default T-shirt config not found" })
  }

  delete defaultConfig._id
  defaultConfig.isDefault = false

  const newConfig = await TshirtPrintConfig.create(defaultConfig)

  res.json({
    printConfigId: newConfig._id,
    config: newConfig
  })
}

export const createProduct = async (req, res) => {
  const product = await Product.create(req.body)
  res.json(product)
}

export const getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
  res.json(product)
}

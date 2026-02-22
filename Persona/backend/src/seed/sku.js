import mongoose from "mongoose"
import dotenv from "dotenv"
import Product from "../models/Product.model.js"

dotenv.config()

const MONGO_URI = process.env.MONGO_URI

const generateSku = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let sku = ""
  for (let i = 0; i < 6; i++) {
    sku += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return sku
}

const ensureUniqueSku = async () => {
  let sku
  let exists = true

  while (exists) {
    sku = generateSku()

    exists = await Product.exists({
      $or: [
        { sku },
        { "productConfig.variants.sku": sku }
      ]
    })
  }

  return sku
}

const replaceAllSkus = async () => {
  try {
    await mongoose.connect(MONGO_URI)

    const products = await Product.find({})

    console.log(`Found ${products.length} products`)

    for (const product of products) {

      // 1️⃣ Replace parent SKU
      const newParentSku = await ensureUniqueSku()
      product.sku = newParentSku

      // 2️⃣ Replace variant SKUs (if any)
      if (product.productConfig?.variants?.length > 0) {
        for (let variant of product.productConfig.variants) {
          const newVariantSku = await ensureUniqueSku()
          variant.sku = newVariantSku
        }
      }

      await product.save()

      console.log(`Updated product ${product._id}`)
    }

    console.log("All parent + variant SKUs replaced successfully")
    process.exit(0)

  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

replaceAllSkus()
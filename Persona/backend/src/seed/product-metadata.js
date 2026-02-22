import mongoose from "mongoose"
import dotenv from "dotenv"
import Product from "../models/Product.model.js"

dotenv.config()

const MONGO_URI = process.env.MONGO_URI

const TITLE_MAP = {
  tshirt: "Premium Cotton Graphic T-Shirt",
  mug: "High-Quality Ceramic Coffee Mug",
  hoodie: "Premium Fleece Pullover Hoodie",
  mobileCase: "Durable Shockproof Mobile Case",
  normal: "Premium Custom Lifestyle Product",
  poster: "High-Resolution Decorative Wall Poster",
  pillow: "Soft Decorative Throw Pillow",
  sticker: "Premium Vinyl Waterproof Sticker",
  hat: "Adjustable Premium Fit Cap",
  other: "Premium Custom Designed Product"
}

const generateProfessionalDescription = (title) => {
  return `
${title} designed with precision and crafted using premium-quality materials.

✔ Superior build quality
✔ Long-lasting durability
✔ Designed for everyday use
✔ Modern and stylish finish

Perfect for personal use or gifting. Manufactured with strict quality standards to ensure customer satisfaction.
`
}

const updateProducts = async () => {
  try {
    await mongoose.connect(MONGO_URI)

    const products = await Product.find({})

    console.log(`Found ${products.length} products`)

    for (const product of products) {

      const newTitle = TITLE_MAP[product.type] || "Premium Custom Designed Product"
      const newDescription = generateProfessionalDescription(newTitle)

      await Product.updateOne(
        { _id: product._id },
        {
          $set: {
            name: newTitle,
            description: newDescription
          }
        }
      )

      console.log(`Updated ${product._id}`)
    }

    console.log("All product titles and descriptions updated successfully")
    process.exit(0)

  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

updateProducts()
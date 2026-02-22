import mongoose from "mongoose"
import dotenv from "dotenv"
import Product from "../models/Product.model.js"

dotenv.config()

const MONGO_URI = process.env.MONGO_URI

/* ---------------- SKU ---------------- */

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

/* ---------------- TITLE ARRAYS ---------------- */

const TITLE_MAP = {
  tshirt: [
    "Premium Graphic Cotton T-Shirt",
    "Urban Streetwear T-Shirt",
    "Minimalist Printed Tee",
    "Oversized Casual T-Shirt"
  ],
  mug: [
    "Premium Ceramic Coffee Mug",
    "Matte Finish Designer Mug",
    "Classic White Tea Cup",
    "Modern Printed Coffee Mug"
  ],
  mobileCase: [
    "Shockproof Mobile Case",
    "Premium Matte Phone Cover",
    "Slim Protective Case",
    "Designer Printed Back Cover"
  ],
  hoodie: [
    "Premium Fleece Hoodie",
    "Urban Street Hoodie",
    "Casual Pullover Hoodie",
    "Heavyweight Winter Hoodie"
  ],
  normal: [
    "Premium Lifestyle Product",
    "Modern Custom Product",
    "Minimalist Designed Product",
    "High Quality Custom Item"
  ]
}

/* ---------------- IMAGES ---------------- */

const IMAGE_POOL = [
  "https://i.ibb.co/vxcjj5xd/1w.jpg",
  "https://i.ibb.co/QFHPrntf/8907605127526-1.jpg",
  "https://i.ibb.co/WvF3Njv8/b-0119493a-9927-4550-8323-baefe5f625c0.webp",
  "https://i.ibb.co/6RDybLt0/S-P-2138.webp",
  "https://i.ibb.co/mCMFvLBy/woochi-popeye-oversized-lavender-tshirt.jpg"
]

const randomImages = () => {
  const shuffled = IMAGE_POOL.sort(() => 0.5 - Math.random())
  const selected = shuffled.slice(0, 2)

  return selected.map((url, index) => ({
    url,
    publicId: `seed-${Math.random().toString(36).substring(2, 8)}`,
    name: "seed-image",
    isMain: index === 0,
    order: index + 1
  }))
}

/* ---------------- VARIANT GENERATOR ---------------- */

const generateVariants = async () => {
  const sizes = ["S", "M", "L", "XL"]
  const colors = ["Black", "White", "Red"]

  const variants = []

  for (let size of sizes) {
    for (let color of colors) {
      const sku = await ensureUniqueSku()

      variants.push({
        sku,
        attributes: new Map([
          ["size", size],
          ["color", color]
        ]),
        stockQuantity: Math.floor(Math.random() * 50),
        soldQuantity: 0
      })
    }
  }

  return variants
}

/* ---------------- SEED FUNCTION ---------------- */

const seedProducts = async () => {
  try {
    await mongoose.connect(MONGO_URI)

    const types = Object.keys(TITLE_MAP)

    const productsToCreate = []

    for (let i = 0; i < 20; i++) {
      const type = types[Math.floor(Math.random() * types.length)]
      const titles = TITLE_MAP[type]
      const title = titles[Math.floor(Math.random() * titles.length)]
      const sku = await ensureUniqueSku()

      const hasVariants = Math.random() > 0.6

      let productConfig = null
      let inventory = {
        sku,
        stockQuantity: Math.floor(Math.random() * 100),
        manageStock: true,
        allowBackorder: false,
        lowStockThreshold: 10,
        soldQuantity: 0
      }

      if (hasVariants && type === "tshirt") {
        const variants = await generateVariants()
        productConfig = {
          attributes: [
            { code: "size", name: "Size", values: ["S", "M", "L", "XL"] },
            { code: "color", name: "Color", values: ["Black", "White", "Red"] }
          ],
          variants
        }

        inventory = { manageStock: false }
      }
const images = randomImages()
      productsToCreate.push({
        name: title,
        slug: `${title.toLowerCase().replace(/\s+/g, "-")}-${i}`,
        type,
        description: `${title} crafted with premium materials and designed for durability and style.`,
        isActive: true,
        pricing: {
          basePrice: Math.floor(Math.random() * 50) + 20,
          specialPrice: Math.floor(Math.random() * 30) + 10,
          currency: "GBP",
          taxInclusive: true
        },
        sku,
        inventory,
        productConfig,
        images: randomImages(),
        thumbnail: images[0].url,
        customization: {
          enabled: false
        }
      })
    }

    await Product.insertMany(productsToCreate)

    console.log("Products seeded successfully")
    process.exit(0)

  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

seedProducts()
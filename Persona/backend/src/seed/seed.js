import mongoose from "mongoose"
import readline from "readline"
import Product from "../models/Product.model.js"


const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://sojanwebyfy_db_user:h8QAojygFWJKaeJY@cluster.osjnccf.mongodb.net/persona?retryWrites=true&w=majority&appName=Cluster"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const ask = (q) => new Promise((res) => rl.question(q, res))

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)]

const randomImages = () =>
  Array.from({ length: Math.floor(Math.random() * 4) + 1 }).map(
    () => `https://picsum.photos/seed/${Math.random()}/600/600`
  )

const buildPersonalizationConfig = () => ({
  areas: [
    {
      areaId: "front",
      label: "Front Print",
      allowedTypes: ["image", "text"],
      maxImages: 1
    },
    {
      areaId: "back",
      label: "Back Print",
      allowedTypes: ["image"],
      maxImages: 2
    }
  ],
  constraints: {
    image: {
      minDpi: 300,
      maxSizeMB: 10,
      formats: ["png", "jpg", "jpeg"]
    },
    text: {
      maxLength: 40
    }
  }
})

const seedProducts = async (type) => {
  const itemTypes = ["tshirt", "mug", "hoodie"]
  const categories = ["gift", "corporate", "festival"]

  const products = Array.from({ length: 10 }).map((_, i) => {
    const productType =
      type === "all" ? randomFrom(["normal", "personalized"]) : type

    return {
      name: `${productType} product ${i + 1}`,
      slug: `${productType}-product-${Date.now()}-${i}`,
      itemType: randomFrom(itemTypes),
      productType,
      category: randomFrom(categories),
      basePrice: Math.floor(Math.random() * 800) + 200,
      stock: Math.floor(Math.random() * 100),
      images: randomImages(),
      variants: {
        sizes: ["S", "M", "L", "XL"],
        colors: ["red", "black", "white"],
        materials: ["cotton", "polyester"]
      },
      personalizationConfig:
        productType === "personalized"
          ? buildPersonalizationConfig()
          : undefined
    }
  })

  await Product.insertMany(products)
}

const main = async () => {
  await mongoose.connect(MONGO_URI)

  const choice = await ask(
    "Seed products:\n1. All\n2. Normal only\n3. Personalized only\nChoose (1/2/3): "
  )

  if (choice === "1") {
    await seedProducts("all")
    console.log("Seeding completed: all products")
  }

  if (choice === "2") {
    await seedProducts("normal")
    console.log("Seeding completed: normal products")
  }

  if (choice === "3") {
    await seedProducts("personalized")
    console.log("Seeding completed: personalized products")
  }

  await mongoose.disconnect()
  rl.close()
  process.exit(0)
}

main()

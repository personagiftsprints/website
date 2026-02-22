import mongoose from "mongoose"
import dotenv from "dotenv"
import Product from "../models/Product.model.js"

dotenv.config()

const MONGO_URI = process.env.MONGO_URI

const deleteTodayProducts = async () => {
  try {
    await mongoose.connect(MONGO_URI)

    const now = new Date()

    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    )

    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23, 59, 59, 999
    )

    const result = await Product.deleteMany({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })

    console.log(`Deleted ${result.deletedCount} products created today`)
    process.exit(0)

  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

deleteTodayProducts()
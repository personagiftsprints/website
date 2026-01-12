import mongoose from "mongoose"
import { initPrintConfigs } from "../bootstrap/initPrintConfig.js"

export const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI)
   await initPrintConfigs()
  console.log("MongoDB Connected")
}

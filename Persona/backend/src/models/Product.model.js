import mongoose from "mongoose"

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  printConfigId: { type: mongoose.Schema.Types.ObjectId },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.model("Product", ProductSchema)

import mongoose from "mongoose"

const SinglePrintAreaSchema = new mongoose.Schema(
  {
    id: { type: String, default: "main" },
    name: { type: String, default: "Print Area" },
    max: { type: String, default: "10 × 10 cm" },
    type: {
      type: String,
      enum: ["text", "image", "both"],
      default: "both"
    },
    description: { type: String, default: "Standard single print area" },
    referenceImages: { type: [String], default: [] }
  },
  { _id: false }
)

const SinglePrintConfigSchema = new mongoose.Schema(
  {
    isDefault: { type: Boolean, default: true },
    productType: {
      type: String,
      required: true,
      enum: ["general"],
      default: "general"
    },
    printable: { type: Boolean, default: true },
    area: { type: SinglePrintAreaSchema, required: true }
  },
  { timestamps: true }
)

export const DEFAULT_SINGLE_PRINT_CONFIG = {
  isDefault: true,
  productType: "general",
  printable: true,
  area: {
    max: "10 × 10 cm",
    type: "both",
    description: "Default single print area for all simple products",
    referenceImages: []
  }
}

export default mongoose.model(
  "SinglePrintConfig",
  SinglePrintConfigSchema
)

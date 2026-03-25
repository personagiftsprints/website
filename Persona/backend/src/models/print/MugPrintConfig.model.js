import mongoose from "mongoose"

const MugAreaSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  max: { type: String, required: true },
  type: { type: String, enum: ["single", "multi"], required: true },
  slots: { type: [String], default: [] },
  references: { type: [String], default: [] },
  description: { type: String }
}, { _id: false })

const MugViewSchema = new mongoose.Schema({
  baseImage: { type: String, required: true },
  areas: { type: [MugAreaSchema], default: [] }
}, { _id: false })

const MugMaterialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  material: { type: String, required: true },
  capacity: { type: String, required: true },
  basePrice: { type: Number, required: true },
  description: { type: String },
  color: { type: String }
}, { _id: false })

const MugPrintConfigSchema = new mongoose.Schema({
  isDefault: { type: Boolean, default: false },
  materials: { type: [MugMaterialSchema], default: [] },
  views: {
    front: { type: MugViewSchema, required: true },
    back: { type: MugViewSchema, required: true },
    center: { type: MugViewSchema, required: true }
  },
  recommendations: {
    fileFormats: { type: [String], default: [] },
    maxFileSize: { type: String },
    recommendedResolution: { type: String },
    colorProfile: { type: String }
  }
}, { timestamps: true })


export const DEFAULT_MUG_PRINT_CONFIG = {
  isDefault: true,
  materials: [
    {
      name: "Ceramic Mug",
      material: "Ceramic",
      capacity: "325 ml",
      basePrice: 249,
      description: "Classic ceramic mug with glossy finish",
      color: "White"
    },
    {
      name: "Magic Mug",
      material: "Heat Sensitive",
      capacity: "325 ml",
      basePrice: 399,
      description: "Color changes with temperature",
      color: "Black"
    }
  ],
  views: {
    front: {
      baseImage: "https://cdn.example.com/mug/front.png",
      areas: [
        {
          id: "front_center",
          name: "Front Center",
          max: "8 × 8 cm",
          type: "single",
          references: [],
          description: "Best for logos or faces"
        }
      ]
    },
    back: {
      baseImage: "https://cdn.example.com/mug/back.png",
      areas: [
        {
          id: "back_center",
          name: "Back Center",
          max: "8 × 8 cm",
          type: "single",
          references: [],
          description: "Ideal for quotes"
        }
      ]
    },
    center: {
      baseImage: "https://cdn.example.com/mug/wrap.png",
      areas: [
        {
          id: "center",
          name: "Center Panel",
          max: "8 × 8 cm per panel",
          type: "single",
          slots: [],
          references: [],
          description: "Center panel design"
        }
      ]
    }
  },
  recommendations: {
    fileFormats: ["PNG", "JPG", "SVG"],
    maxFileSize: "5MB",
    recommendedResolution: "300 DPI",
    colorProfile: "CMYK"
  }
}


export default mongoose.model(
  "MugPrintConfig",
  MugPrintConfigSchema
)

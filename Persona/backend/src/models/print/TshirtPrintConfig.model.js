import mongoose from "mongoose"

const TshirtAreaSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  max: { type: String, required: true },
  references: { type: [String], default: [] }
}, { _id: false })

const TshirtViewSchema = new mongoose.Schema({
  baseImage: { type: String, required: true },
  areas: { type: [TshirtAreaSchema], default: [] }
}, { _id: false })

const TshirtPrintConfigSchema = new mongoose.Schema({
  isDefault: { type: Boolean, default: false },
  views: {
    front: { type: TshirtViewSchema, required: true },
    back: { type: TshirtViewSchema, required: true }
  }
}, { timestamps: true })

export const DEFAULT_TSHIRT_PRINT_CONFIG = {
  isDefault: true,
  views: {
    front: {
      baseImage: "https://i.ebayimg.com/images/g/F1sAAOSwritnkPyp/s-l1200.jpg",
      areas: [
        {
          id: "center_chest",
          name: "Center Chest",
          max: "25 × 30 cm",
          references: [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
            "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a",
            "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c"
          ]
        },
        {
          id: "left_chest",
          name: "Left Chest",
          max: "10 × 10 cm",
          references: [
            "https://images.unsplash.com/photo-1551028719-00167b16eac5",
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf"
          ]
        }
      ]
    },
    back: {
      baseImage: "https://cdn.example.com/tshirt/back-base.png",
      areas: [
        {
          id: "full_back",
          name: "Full Back",
          max: "30 × 35 cm",
          references: [
            "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9",
            "https://images.unsplash.com/photo-1582418702059-97ebafb35d09",
            "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6"
          ]
        }
      ]
    }
  }
}

export default mongoose.model(
  "TshirtPrintConfig",
  TshirtPrintConfigSchema
)

import mongoose from "mongoose"

const collectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },

    description: {
      type: String
    },

    image: {
      url: String,
      publicId: String,
      name: String
    },

    type: {
      type: String,
      enum: ["MANUAL", "PRODUCT_TYPE"],
      required: true
    },

    productTypes: [
      {
        type: String
      }
    ],

    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    ],

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

collectionSchema.index({ title: 1 })

export default mongoose.model("Collection", collectionSchema)
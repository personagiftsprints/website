import mongoose from "mongoose"

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      unique: true
    },
    description: {
      type: String
    },
    collectionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: true
    },
    image: {
      url: String,
      publicId: String
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

export default mongoose.model("Event", eventSchema)

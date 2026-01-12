import mongoose from "mongoose"

const homeBannerSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    width: { type: Number, default: 8063 },
    height: { type: Number, default: 2419 }
  },
  { _id: false }
)

const discountBannerSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    messages: { type: [String], default: [] }
  },
  { _id: false }
)

const homeContentSchema = new mongoose.Schema(
  {
    homeBanner: homeBannerSchema,
    discountBanner: discountBannerSchema
  },
  { timestamps: true }
)

export default mongoose.model("HomeContent", homeContentSchema)

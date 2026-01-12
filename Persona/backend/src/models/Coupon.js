import mongoose from "mongoose"

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    usedCount: { type: Number, default: 0 }
  },
  { timestamps: true }
)

export default mongoose.model("Coupon", CouponSchema)

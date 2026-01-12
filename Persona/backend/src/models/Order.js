import mongoose from "mongoose"

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: Array,
  address: Object,
  coupon: String,
  total: Number,
  status: { type: String, default: "paid" }
}, { timestamps: true })

export default mongoose.model("Order", OrderSchema)

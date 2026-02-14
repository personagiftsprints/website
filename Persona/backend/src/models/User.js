import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    town: { type: String, required: true },
    county: String,
    postcode: { type: String, required: true },
    countryCode: { type: String, default: "GB" },
    email: String,
    phone: { type: String, required: true }
  },
  { _id: true }
)

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, default: null },
    firstName: String,
    lastName: String,
    provider: { type: String, enum: ["email", "google"], required: true },
    googleId: String,
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    addresses: [addressSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

userSchema.methods.comparePassword = function (password) {
  if (!this.password) return false
  return bcrypt.compare(password, this.password)
}

export default mongoose.model("User", userSchema)

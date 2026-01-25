import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const addressSchema = new mongoose.Schema(
  {
    fullName: String,
    street: String,
    landmark: String,
    city: String,
    county: String,
    postcode: String,
    country: { type: String, default: "UK" },
    phone: String,
  },
  { _id: false }
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

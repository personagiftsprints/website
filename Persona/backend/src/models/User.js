import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  role: { type: String, default: "user" },
  isGuest: { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.model("User", UserSchema)

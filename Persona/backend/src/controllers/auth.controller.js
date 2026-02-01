import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import User from "../models/User.js"

const signToken = user =>
  jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  )

export const emailCheck = async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })
  res.json({ exists: !!user })
}

export const emailAuth = async (req, res) => {
  const { email, password, firstName, lastName } = req.body
  let user = await User.findOne({ email })

  if (user) {
    if (!user.password) {
      user.password = await bcrypt.hash(password, 10)
      await user.save()
    } else {
      const valid = await user.comparePassword(password)
      if (!valid) return res.status(401).json({ status: "invalid_password" })
    }
  } else {
    const hashed = await bcrypt.hash(password, 10)
    user = await User.create({
      email,
      password: hashed,
      firstName,
      lastName,
      provider: "email",
      role: "customer",
    })
  }

  const token = signToken(user)

  res.json({
    status: "success",
    token,
    user: {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      provider: user.provider,
    },
  })
}

export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password")
  res.json({ status: "success", user })
}

export const resetPassword = async (req, res) => {
  const { email, newPassword } =res.body

  if (!email || !newPassword) {
    return res.status(400).json({ status: "invalid_payload" })
  }

  const user = await User.findOne({ email })

  if (!user || user.provider !== "email") {
    return res.status(404).json({ status: "user_not_found" })
  }

  user.password = await bcrypt.hash(newPassword, 10)
  await user.save()

  res.json({ status: "success" })
}

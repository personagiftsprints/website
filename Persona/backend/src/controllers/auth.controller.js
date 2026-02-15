import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import User from "../models/User.js"

import crypto from "crypto"


import { passwordResetTemplate } from "../utils/emailTemplates.js"
import { sendMail } from "../utils/mailer.js"


import { OAuth2Client } from "google-auth-library"

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export const googleAuth = async (req, res) => {
  const { token } = req.body

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    const { sub, email, given_name, family_name } = payload

    let user = await User.findOne({ email })

    if (!user) {
      user = await User.create({
        email,
        firstName: given_name,
        lastName: family_name,
        provider: "google",
        googleId: sub,
        role: "customer",
      })
    }

    const jwtToken = signToken(user)

    res.json({
      status: "success",
      token: jwtToken,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        provider: user.provider,
      },
    })
  } catch (err) {
    res.status(401).json({ status: "invalid_google_token" })
  }
}


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


export const resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Invalid payload" })
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token"
      })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined

    await user.save()

    res.json({ status: "success" })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}


export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user || user.provider !== "email") {
      return res.status(200).json({
        status: "success",
        message: "If that email exists, a reset link has been sent."
      })
    }

    const resetToken = crypto.randomBytes(32).toString("hex")

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex")

    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000

    await user.save()

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

    const emailTemplate = passwordResetTemplate({
      name: user.firstName || "Customer",
      resetLink
    })

    await sendMail({
      to: user.email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html
    })

    res.json({ status: "success" })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}

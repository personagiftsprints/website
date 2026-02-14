import express from "express"
import { adminOnly, authMiddleware, customerOnly } from "../middlewares/auth.middleware.js"
import User from "../models/User.js"

const router = express.Router()

router.post("/address", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user._id)

  const {
    fullName,
    addressLine1,
    addressLine2,
    town,
    county,
    postcode,
    phone,
    email
  } = req.body

  const ukPostcodeRegex =
    /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i

  // if (!ukPostcodeRegex.test(postcode)) {
  //   return res.status(400).json({
  //     status: "error",
  //     message: "Invalid UK postcode"
  //   })
  // }

  user.addresses.push({
    fullName,
    addressLine1,
    addressLine2,
    town,
    county,
    postcode: postcode.toUpperCase(),
    countryCode: "GB",
    phone,
    email
  })

  await user.save()

  res.json({
    status: "success",
    addresses: user.addresses
  })
})


router.delete("/address/:addressId", authMiddleware, async (req, res) => {
  const { addressId } = req.params

  const user = await User.findById(req.user._id)
  if (!user) {
    return res.status(404).json({ status: "error", message: "User not found" })
  }

  user.addresses = user.addresses.filter(
    addr => addr._id.toString() !== addressId
  )

  await user.save()

  res.json({
    status: "success",
    addresses: user.addresses
  })
})


router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password")
  res.json({ status: "success", user })
})

router.put("/me", authMiddleware, async (req, res) => {
  const { firstName, lastName } = req.body

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { firstName, lastName },
    { new: true }
  ).select("-password")

  res.json({ status: "success", user })
})




export default router

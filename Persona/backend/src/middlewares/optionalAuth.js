import jwt from "jsonwebtoken"

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null
    console.log("🟡 optionalAuth: NO TOKEN (guest)")
    return next()
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 👇 IMPORTANT: normalize what you store in req.user
    req.user = {
      _id: decoded._id,
      role: decoded.role
    }

    console.log("🟢 optionalAuth USER ID:", decoded._id)
  } catch (err) {
    console.log("🔴 optionalAuth INVALID TOKEN")
    req.user = null
  }

  next()
}

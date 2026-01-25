import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const authMiddleware = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ status: "unauthorized" })
  }

  const token = auth.split(" ")[1]
  const decoded = jwt.verify(token, process.env.JWT_SECRET)

  const user = await User.findById(decoded._id).select("role")
  if (!user) {
    return res.status(401).json({ status: "unauthorized" })
  }

  req.user = {
    _id: decoded._id,
    role: user.role,
  }

  next()
}

export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ status: "forbidden" })
  }
  next()
}

export const customerOnly = (req, res, next) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ status: "forbidden" })
  }
  next()
}

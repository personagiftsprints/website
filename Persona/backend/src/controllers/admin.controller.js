import User from "../models/User.js"
import Order from "../models/Order.js"

export const stats = async (_, res) => {
  res.json({
    users: await User.countDocuments(),
    orders: await Order.countDocuments()
  })
}

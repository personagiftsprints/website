import User from "../models/User.js"
import Order from "../models/Order.js"
import ProductModel from "../models/Product.model.js";
import Coupon from "../models/Coupon.js";

export const stats = async (_, res) => {
  res.json({
    users: await User.countDocuments(),
    orders: await Order.countDocuments()
  })
}


export const getDashboardSummary = async (req, res) => {
  try {
    const { period = "week" } = req.query

    const now = new Date()
    let startDate

    switch (period) {
      case "today":
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        break

      case "week":
        startDate = new Date()
        startDate.setDate(now.getDate() - 6)
        startDate.setHours(0, 0, 0, 0)
        break

      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break

      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break

      default:
        startDate = new Date()
        startDate.setDate(now.getDate() - 6)
        startDate.setHours(0, 0, 0, 0)
    }

    const [
      totalUsers,
      totalOrders,
      totalProducts,
      activeCoupons,
      revenueAgg,
      ordersByStatus,
      revenueTrend
    ] = await Promise.all([

      User.countDocuments(),
      Order.countDocuments(),
      ProductModel.countDocuments(),
      Coupon.countDocuments({ isActive: true }),

      // TOTAL REVENUE (exclude cancelled)
      Order.aggregate([
        { $match: { orderStatus: { $ne: "cancelled" } } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" }
          }
        }
      ]),

      // ORDER STATUS BREAKDOWN
      Order.aggregate([
        {
          $group: {
            _id: "$orderStatus",
            count: { $sum: 1 }
          }
        }
      ]),

      // REVENUE TREND (selected period)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            orderStatus: { $ne: "cancelled" }
          }
        },
        {
          $group: {
            _id:
              period === "year"
                ? { $month: "$createdAt" }
                : {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" }
                  },
            total: { $sum: "$totalAmount" }
          }
        },
        { $sort: { "_id": 1 } }
      ])
    ])

    // ---------- STATUS MAP ----------
    const statusMap = {
      created: 0,
      paid: 0,
      processing: 0,
      printing: 0,
      out_for_delivery: 0,
      cancelled: 0
    }

    ordersByStatus.forEach(item => {
      if (statusMap[item._id] !== undefined) {
        statusMap[item._id] = item.count
      }
    })

    // ---------- FORMAT TREND ----------
    const formattedTrend = revenueTrend.map(item => {
      if (period === "year") {
        return {
          label: `Month ${item._id}`,
          value: item.total
        }
      }

      return {
        label: `${item._id.day}/${item._id.month}`,
        value: item.total
      }
    })

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      activeCoupons,
      revenue: {
        total: revenueAgg[0]?.total || 0,
        trend: formattedTrend
      },
      orders: statusMap
    })

  } catch (err) {
    console.error("Dashboard Error:", err)
    res.status(500).json({ message: "Dashboard fetch failed" })
  }
}

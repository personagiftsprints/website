"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getMyOrders } from "@/services/order.service"

/* ---------------- HELPERS ---------------- */
const getProductSummary = items => {
  if (!items || items.length === 0) return ""

  if (items.length === 1) {
    return items[0].productSnapshot?.name || "Product"
  }

  return `${items[0].productSnapshot?.name} + ${items.length - 1} more`
}

/* ---------------- PAGE ---------------- */
export default function MyOrdersPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await getMyOrders()
        setOrders(res.orders || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading your orders…</p>
      </div>
    )
  }

  /* ---------------- NOT LOGGED IN ---------------- */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">
            Please login to view your orders
          </h2>

          <button
            onClick={() => window.dispatchEvent(new Event("open-auth"))}
            className="bg-black text-white px-6 py-3 rounded"
          >
            Login
          </button>

          <Link
            href="/products"
            className="block text-sm text-gray-600 underline"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    )
  }

  /* ---------------- NO ORDERS ---------------- */
  if (!orders.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">No orders yet</h2>
          <p className="text-gray-600">
            You haven’t placed any orders.
          </p>

          <Link
            href="/products"
            className="inline-block bg-black text-white px-6 py-3 rounded"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  /* ---------------- ORDERS LIST ---------------- */
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map(order => (
          <div
            key={order._id}
            className="border rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between"
          >
            {/* LEFT */}
            <div className="space-y-1">
              <p className="font-semibold">
                Order #{order.orderNumber}
              </p>

              <p className="text-sm text-gray-700">
                {getProductSummary(order.items)}
              </p>

              {order.items.length > 1 && (
                <p className="text-xs text-gray-500">
                  {order.items.length} items
                </p>
              )}

              <p className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>

              <p className="text-sm">
                Status:{" "}
                <span className="font-medium capitalize">
                  {order.orderStatus}
                </span>
              </p>
            </div>

            {/* RIGHT */}
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              <p className="font-semibold">
                £{Number(order.totalAmount).toFixed(2)}
              </p>

              <Link
                href={`/order/${order._id}`}
                className="border px-4 py-2 rounded hover:bg-gray-100"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

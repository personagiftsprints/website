"use client"

import { useEffect, useState } from "react"
import { CheckCircle } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function OrderSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")

  const [loading, setLoading] = useState(true)
  const [orderDetails, setOrderDetails] = useState(null)

  useEffect(() => {
    // 🔐 CHECK LOGIN STATUS
    const user = localStorage.getItem("auth")

    if (user) {
      // ✅ Logged-in user → redirect to orders page
      router.replace("/order")
      return
    }

    // 👤 Guest flow continues below
    if (!sessionId) {
      setLoading(false)
      return
    }

    fetch(`/api/orders/session/${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error("Order not found")
        return res.json()
      })
      .then(data => {
        setOrderDetails(data)
        setLoading(false)
        localStorage.removeItem("cart")
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [sessionId, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600">
              Thank you for your purchase.
            </p>
          </div>

          {orderDetails && (
            <div className="border-t pt-8">
              <h2 className="text-lg font-semibold mb-4">
                Order Details
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number</span>
                  <span className="font-medium">
                    {orderDetails.orderNumber}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="font-medium">
                    ${Number(orderDetails.totalAmount || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600">
                    {orderDetails.orderStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md text-center font-medium hover:bg-blue-700"
            >
              Continue Shopping
            </Link>

            <Link
              href="/orders"
              className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-md text-center font-medium hover:bg-gray-50"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

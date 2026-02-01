"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function SuccessClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    fetch(`/api/orders/session/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data)
        localStorage.removeItem("cart")
        setLoading(false)

        if (localStorage.getItem("auth")) {
          setTimeout(() => router.replace("/orders"), 3000)
        }
      })
      .catch(() => setLoading(false))
  }, [sessionId, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading order…
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-4">
      <CheckCircle className="w-16 h-16 text-green-500" />
      <h1 className="text-2xl font-semibold">Order Confirmed</h1>

      {order && (
        <p className="text-gray-600">
          Order #{order.orderNumber}
        </p>
      )}

      <div className="flex gap-4">
        <Link href="/" className="underline">
          Continue Shopping
        </Link>
        <Link href="/orders" className="underline">
          View Orders
        </Link>
      </div>
    </div>
  )
}

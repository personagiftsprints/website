"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Lottie from "lottie-react"
import orderAnimation from "@/assets/order.json"
import { getOrderBySessionId } from "@/services/order.service"

export default function SuccessClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("auth"))
       localStorage.removeItem("cart")

    if (!sessionId) {
      setLoading(false)
      return
    }

    const loadOrder = async () => {
      try {
        const res = await getOrderBySessionId(sessionId)
        setOrder(res.order)
        localStorage.removeItem("cart")
      } catch {
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading order…
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-4 px-4">
      <div className="w-64 h-64">
        <Lottie
          animationData={orderAnimation}
          loop={false}
          onComplete={() => {
            if (isLoggedIn) {
              router.replace("/order")
            }
          }}
        />
      </div>

      <h1 className="text-2xl font-semibold">
        Order Confirmed
      </h1>

      {order && (
        <p className="text-gray-600">
          Order #{order.orderNumber}
        </p>
      )}

      {!isLoggedIn && (
        <p className="text-sm text-gray-500 max-w-md">
          You are not logged in.  
          Order details will be sent to your email shortly.
        </p>
      )}

      <div className="flex gap-4 mt-4">
        <Link href="/" className="underline">
          Continue Shopping
        </Link>

        {isLoggedIn && (
          <Link href="/order" className="underline">
            View Orders
          </Link>
        )}
      </div>
    </div>
  )
}

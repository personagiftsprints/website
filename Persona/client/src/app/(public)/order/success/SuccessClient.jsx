"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Lottie from "lottie-react"
import orderAnimation from "@/assets/order.json"
import { verifyPayment } from "@/services/payment.service"
import { getOrderBySessionId, getOrderById } from "@/services/order.service"

export default function SuccessClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")
  const orderIdParam = searchParams.get("order_id")

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("auth"))
    localStorage.removeItem("cart")

    if (!sessionId && !orderIdParam) {
      setLoading(false)
      return
    }

    const loadOrder = async () => {
      try {
        if (sessionId) {
          console.log("🚀 Verifying payment for session:", sessionId);
          await verifyPayment(sessionId).catch(e => console.error("Verify failed but continuing:", e));
        }

        let orderData = null
        if (sessionId) {
          try {
            const res = await getOrderBySessionId(sessionId)
            orderData = res.order
          } catch (e) {
            console.warn("Session ID lookup failed, attempting order_id fallback:", e.message)
          }
        }

        if (!orderData && orderIdParam) {
          try {
            const res = await getOrderById(orderIdParam)
            orderData = res.order || res
          } catch (e) {
            console.error("Order ID fallback failed:", e.message)
          }
        }

        setOrder(orderData)
        localStorage.removeItem("cart")
      } catch (err) {
        console.error("Success Page Error:", err);
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [sessionId, orderIdParam])

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

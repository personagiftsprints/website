"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getOrderById } from "@/services/order.service"

const STATUS_STYLE = {
  paid: "bg-emerald-100 text-emerald-700",
  processing: "bg-yellow-100 text-yellow-700",
  printing: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700"
}

const STATUS_FLOW = [
  "paid",
  "processing",
  "printing",
  "out_for_delivery"
]

export default function OrderDetailsPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orderId) return

    getOrderById(orderId)
      .then(res => setOrder(res.order || res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Loading order…
      </div>
    )
  }

  if (!order || error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2">
        <p className="text-slate-600">Order not found</p>
        <Link href="/" className="underline text-sm">
          Go home
        </Link>
      </div>
    )
  }

  const currentStatus = order.orderStatus

  const currentIndex = STATUS_FLOW.indexOf(currentStatus)

  const addr = order.deliveryAddress || {}

  const normalizedAddress = {
    fullName: addr.fullName || "",
    addressLine1: addr.addressLine1 || "",
    addressLine2: addr.addressLine2 || "",
    town: addr.town || addr.city || "",
    county: addr.county || addr.state || "",
    postcode: addr.postcode || addr.postalCode || "",
    country:
      addr.countryCode === "GB"
        ? "United Kingdom"
        : addr.country || "",
    phone: addr.phone || "",
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-10">

        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">
            Order #{order.orderNumber}
          </h1>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-slate-500">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>

            <span
              className={`px-3 py-1 text-xs rounded-full font-medium capitalize ${STATUS_STYLE[currentStatus]}`}
            >
              {currentStatus.replace(/_/g, " ")}
            </span>
          </div>

          {/* Progress Flow */}
        

          {currentStatus === "cancelled" && (
            <p className="text-sm text-red-600 mt-2">
              This order has been cancelled.
            </p>
          )}
        </div>

        {/* Items */}
        <div className="space-y-8">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-4 border-b pb-6">
              <img
                src={item.productSnapshot.image}
                className="w-20 h-20 object-cover rounded"
                alt=""
              />

              <div className="flex-1">
                <p className="font-medium">
                  {item.productSnapshot.name}
                </p>

                {item.variant && (
                  <p className="text-xs text-slate-500 mt-1">
                    {item.variant.size && `Size: ${item.variant.size}`}
                    {item.variant.color_label && ` · ${item.variant.color_label}`}
                  </p>
                )}
              </div>

              <div className="text-right text-sm">
                <p className="font-medium">
                  £{(item.productSnapshot.finalPrice * item.quantity).toFixed(2)}
                </p>
                <p className="text-slate-500">
                  £{item.productSnapshot.finalPrice} × {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Address & Summary */}
        <div className="grid sm:grid-cols-2 gap-10 text-sm">

          <div className="space-y-1">
            <p className="font-medium">Delivery address</p>

            <p>{normalizedAddress.fullName}</p>
            <p>{normalizedAddress.addressLine1}</p>

            {normalizedAddress.addressLine2 && (
              <p>{normalizedAddress.addressLine2}</p>
            )}

            <p>
              {normalizedAddress.town}
              {normalizedAddress.county && `, ${normalizedAddress.county}`}
            </p>

            <p className="font-medium">
              {normalizedAddress.postcode}
            </p>

            <p>{normalizedAddress.country}</p>

            <p className="text-slate-500 mt-1">
              {normalizedAddress.phone}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>£{order.subtotal.toFixed(2)}</span>
            </div>

            {order.discount?.amount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Coupon applied</span>
                <span>-£{order.discount.amount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-slate-500">Delivery</span>
              <span>£{order.deliveryCharge.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>£{order.totalAmount.toFixed(2)}</span>
            </div>

            <p className="text-xs text-slate-500">
              Paid via {order.payment?.provider}
            </p>
          </div>

        </div>

        <div className="flex gap-6 text-sm">
          <Link href="/products" className="underline">
            Continue shopping
          </Link>

          <Link href="/order" className="underline">
            View all orders
          </Link>
        </div>

      </div>
    </div>
  )
}

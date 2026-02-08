"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getOrderById } from "@/services/order.service"

const STATUS_STYLE = {
  paid: "text-emerald-600",
  printing: "text-purple-600",
  shipped: "text-blue-600",
}

const STATUS_FLOW = ["paid", "printing", "shipped"]

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

  const orderStatus = STATUS_FLOW.includes(order.orderStatus)
    ? order.orderStatus
    : "paid"

  const currentStatusIndex = STATUS_FLOW.indexOf(orderStatus)

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-10">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">
            Order #{order.orderNumber}
          </h1>

          <p className="text-sm text-slate-500">
            {new Date(order.createdAt).toLocaleDateString()}
            {" · "}
            <span className={`capitalize ${STATUS_STYLE[orderStatus]}`}>
              {orderStatus}
            </span>
          </p>

          {/* Status flow */}
          <div className="text-sm">
            {STATUS_FLOW.map((status, index) => (
              <span
                key={status}
                className={
                  index <= currentStatusIndex
                    ? "font-medium text-slate-900"
                    : "text-slate-400"
                }
              >
                {status}
                {index < STATUS_FLOW.length - 1 && " → "}
              </span>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="space-y-6">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-4">
              <img
                src={item.productSnapshot.image}
                className="w-20 h-20 object-cover"
                alt=""
              />

              <div className="flex-1">
                <p className="font-medium">
                  {item.productSnapshot.name}
                </p>
                <p className="text-sm text-slate-500">
                  {item.productSnapshot.type}
                </p>

                {item.variant && (
                  <p className="text-xs text-slate-500 mt-1">
                    {item.variant.size && `Size: ${item.variant.size}`}
                    {item.variant.color && ` · ${item.variant.color}`}
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
            <p>{order.deliveryAddress.fullName}</p>
            <p>{order.deliveryAddress.addressLine1}</p>
            <p>
              {order.deliveryAddress.city},{" "}
              {order.deliveryAddress.postalCode}
            </p>
            <p>{order.deliveryAddress.country}</p>
            <p className="text-slate-500 mt-1">
              {order.deliveryAddress.phone}
            </p>
          </div>

       <div className="space-y-2">
  <div className="flex justify-between">
    <span className="text-slate-500">Subtotal</span>
    <span>£{order.subtotal.toFixed(2)}</span>
  </div>

  {order.discount?.amount > 0 && (
    <div className="flex justify-between text-emerald-600">
      <span>
        Coupon code added
      </span>
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

        {/* Actions */}
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

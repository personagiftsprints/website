"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getOrderById } from "@/services/order.service"

const STATUS_STYLE = {
  paid: "bg-emerald-50 text-emerald-700",
  processing: "bg-amber-50 text-amber-700",
  printing: "bg-purple-50 text-purple-700",
  shipped: "bg-blue-50 text-blue-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
}

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
      <div className="min-h-screen grid place-items-center text-sm text-slate-500">
        Loading order…
      </div>
    )
  }

  if (!order || error) {
    return (
      <div className="min-h-screen grid place-items-center text-center space-y-4">
        <p className="text-slate-600">Order not found</p>
        <Link href="/" className="text-sm underline">
          Go home
        </Link>
      </div>
    )
  }

  const statusClass =
    STATUS_STYLE[order.orderStatus] || STATUS_STYLE.paid

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-sm text-slate-500">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>

       
        </div>

        {/* Items */}
        <div className="bg-white border rounded-lg divide-y">
          {order.items.map((item, i) => (
            <div key={i} className="p-4 flex gap-4">
              <img
                src={item.productSnapshot.image}
                className="w-20 h-20 object-cover rounded border"
                alt=""
              />

              <div className="flex-1">
                <p className="font-medium text-slate-900">
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

        {/* Info Grid */}
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Address */}
          <div className="bg-white border rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Delivery Address</p>
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

          {/* Summary */}
          <div className="bg-white border rounded-lg p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>£{order.subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-medium border-t pt-2">
              <span>Total</span>
              <span>£{order.totalAmount.toFixed(2)}</span>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Paid via {order.payment?.provider}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/products"
            className="flex-1 text-center bg-slate-900 text-white py-2 rounded-md text-sm"
          >
            Continue shopping
          </Link>

          <Link
            href="/order"
            className="flex-1 text-center border py-2 rounded-md text-sm"
          >
            View all orders
          </Link>
        </div>

      </div>
    </div>
  )
}

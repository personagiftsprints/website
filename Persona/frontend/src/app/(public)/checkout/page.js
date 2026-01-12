"use client"

import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { applyCoupon } from "@/services/checkout.service"
import { createCheckoutSession } from "@/services/payment.service"

export default function CheckoutClient() {
  const [items, setItems] = useState([])
  const [coupon, setCoupon] = useState("")
  const [discount, setDiscount] = useState(0)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState("")
  const [loadingPayment, setLoadingPayment] = useState(false)

  /* -------------------------------
     LOAD CART FROM LOCAL STORAGE
  --------------------------------*/

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    setItems(cart)
  }, [])

  /* -------------------------------
     UI PRICE (DISPLAY ONLY)
     ⚠️ NOT TRUSTED FOR PAYMENT
  --------------------------------*/

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    )
  }, [items])

  const discountAmount = (subtotal * discount) / 100
  const total = subtotal - discountAmount

  /* -------------------------------
     COUPON PREVIEW (UI ONLY)
  --------------------------------*/

  const handleApplyCoupon = async () => {
    try {
      const res = await applyCoupon(coupon)

      if (!res.valid) {
        setError(res.message || "Invalid coupon")
        setDiscount(0)
        setApplied(false)
      } else {
        setDiscount(res.discount)
        setApplied(true)
        setError("")
      }
    } catch {
      setError("Coupon validation failed")
    }
  }

  /* -------------------------------
     PLACE ORDER (SECURE)
     Backend recalculates everything
  --------------------------------*/

const handlePlaceOrder = async () => {
  try {
    setLoadingPayment(true)

    const cart = JSON.parse(localStorage.getItem("cart") || "[]")

    const data = await createCheckoutSession({
      mode: "cart",
      cart,
      couponCode: coupon || null
    })

    window.location.href = data.url
  } catch (err) {
    alert(err.message)
    setLoadingPayment(false)
  }
}

  return (
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-10">

      {/* ORDER SUMMARY */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Order Summary</h2>

        {items.length === 0 && (
          <p className="text-gray-500">No items in cart</p>
        )}

        {items.map((item, index) => (
          <div key={index} className="flex gap-4">
            <div className="relative w-20 h-20 bg-zinc-100 rounded overflow-hidden">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>

            <div className="flex-1">
              <p className="font-medium">{item.name}</p>

              {(item.selectedVariants?.size || item.selectedVariants?.color) && (
                <p className="text-xs text-gray-500">
                  {item.selectedVariants?.size && `Size: ${item.selectedVariants.size}`}{" "}
                  {item.selectedVariants?.color && `| Color: ${item.selectedVariants.color}`}
                </p>
              )}

              <p className="text-sm text-zinc-500">
                ₹{item.price} × {item.quantity}
              </p>
            </div>

            <p className="font-medium">
              ₹{item.price * item.quantity}
            </p>
          </div>
        ))}

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          {applied && (
            <div className="flex justify-between text-green-600">
              <span>Coupon Discount</span>
              <span>-₹{discountAmount}</span>
            </div>
          )}

          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </div>
      </div>

      {/* CHECKOUT */}
      <div className="bg-white border rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-semibold">Checkout</h2>

        <div>
          <label className="text-sm font-medium">Apply Coupon</label>
          <div className="flex gap-2">
            <input
              value={coupon}
              onChange={e => setCoupon(e.target.value.toUpperCase())}
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              onClick={handleApplyCoupon}
              className="bg-black text-white px-4 rounded"
            >
              Apply
            </button>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={loadingPayment || items.length === 0}
          className="w-full bg-black text-white py-3 rounded disabled:opacity-60"
        >
          {loadingPayment ? "Redirecting to Payment..." : "Place Order"}
        </button>
      </div>
    </div>
  )
}

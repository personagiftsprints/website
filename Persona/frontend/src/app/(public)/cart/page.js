"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Plus, Minus, Trash2 } from "lucide-react"

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState([])
  const [hasLoaded, setHasLoaded] = useState(false)

  /* --------------------------------
     LOAD + NORMALIZE CART (ONCE)
  ----------------------------------*/
  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem("cart") || "[]")

    const merged = []

    for (const item of raw) {
      const existing = merged.find(
        i =>
          i.productId === item.productId &&
          i.selectedVariants?.size === item.selectedVariants?.size &&
          i.selectedVariants?.color === item.selectedVariants?.color
      )

      if (existing) {
        existing.quantity += item.quantity
      } else {
        merged.push({ ...item })
      }
    }

    setCart(merged)
    setHasLoaded(true)
  }, [])

  /* --------------------------------
     SYNC TO LOCAL STORAGE
  ----------------------------------*/
  useEffect(() => {
    if (!hasLoaded) return
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart, hasLoaded])

  /* --------------------------------
     UPDATE QUANTITY (SAFE)
  ----------------------------------*/
  const updateQty = (productId, size, color, delta) => {
    setCart(prev =>
      prev.map(item =>
        item.productId === productId &&
        item.selectedVariants?.size === size &&
        item.selectedVariants?.color === color
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    )
  }

  const removeItem = (productId, size, color) => {
    setCart(prev =>
      prev.filter(
        item =>
          !(
            item.productId === productId &&
            item.selectedVariants?.size === size &&
            item.selectedVariants?.color === color
          )
      )
    )
  }

  const subtotal = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  }, [cart])

  if (hasLoaded && cart.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-10 text-center">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <button
          onClick={() => router.push("/products")}
          className="px-6 py-3 bg-black text-white"
        >
          Continue Shopping
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 grid lg:grid-cols-3 gap-8">

      {/* CART ITEMS */}
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-2xl font-semibold">Shopping Cart</h1>

        {cart.map(item => {
          const key = `${item.productId}-${item.selectedVariants?.size || "na"}-${item.selectedVariants?.color || "na"}`

          return (
            <div
              key={key}
              className="flex gap-4  rounded-lg p-4 bg-white"
            >
              <div className="relative w-24 h-24 bg-gray-100 rounded overflow-hidden">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <p className="font-medium">{item.name}</p>

                {(item.selectedVariants?.size || item.selectedVariants?.color) && (
                  <p className="text-sm text-gray-500">
                    {item.selectedVariants?.size && `Size: ${item.selectedVariants.size}`}{" "}
                    {item.selectedVariants?.color && `| Color: ${item.selectedVariants.color}`}
                  </p>
                )}

                <p className="text-sm text-gray-600">₹{item.price}</p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      updateQty(
                        item.productId,
                        item.selectedVariants?.size,
                        item.selectedVariants?.color,
                        -1
                      )
                    }
                    className="border p-1"
                  >
                    <Minus size={14} />
                  </button>

                  <span className="w-6 text-center">{item.quantity}</span>

                  <button
                    onClick={() =>
                      updateQty(
                        item.productId,
                        item.selectedVariants?.size,
                        item.selectedVariants?.color,
                        1
                      )
                    }
                    className="border p-1"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-between items-end">
                <button
                  onClick={() =>
                    removeItem(
                      item.productId,
                      item.selectedVariants?.size,
                      item.selectedVariants?.color
                    )
                  }
                  className="text-red-600"
                >
                  <Trash2 size={18} />
                </button>

                <p className="font-semibold">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* SUMMARY */}
      <div className="bg-white border rounded-lg p-6 h-fit space-y-4">
        <h2 className="text-lg font-semibold">Order Summary</h2>

        {/* <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div> */}

        <button
          onClick={() => router.push("/checkout?mode=cart")}
          className="w-full bg-black text-white py-3 rounded"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  )
}

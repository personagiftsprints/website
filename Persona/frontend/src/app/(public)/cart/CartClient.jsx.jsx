"use client"

import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function CartClient() {
  const router = useRouter()
  const [items, setItems] = useState([])

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    setItems(cart)
  }, [])

  const updateQty = (productId, qty) => {
    const updated = items.map(i =>
      i.productId === productId ? { ...i, quantity: qty } : i
    )
    setItems(updated)
    localStorage.setItem("cart", JSON.stringify(updated))
  }

  const removeItem = productId => {
    const updated = items.filter(i => i.productId !== productId)
    setItems(updated)
    localStorage.setItem("cart", JSON.stringify(updated))
  }

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items]
  )

  if (!items.length) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <button
          onClick={() => router.push("/products")}
          className="mt-4 bg-black text-white px-6 py-3 rounded"
        >
          Continue Shopping
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-4">
        {items.map(item => (
          <div
            key={item.productId}
            className="flex gap-4 border rounded-lg p-4"
          >
            <div className="relative w-24 h-24 bg-zinc-100 rounded overflow-hidden">
              <Image src={item.image} alt={item.name} fill />
            </div>

            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-zinc-500">
                ${item.price}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e =>
                    updateQty(item.productId, Number(e.target.value))
                  }
                  className="w-16 border rounded px-2 py-1"
                />
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-sm text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>

            <p className="font-semibold">
              ${item.price * item.quantity}
            </p>
          </div>
        ))}
      </div>

      <div className="border rounded-xl p-6 h-fit space-y-4">
        <h2 className="text-lg font-semibold">Summary</h2>

        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal}</span>
        </div>

        <button
          onClick={() => router.push("/checkout")}
          className="w-full bg-black text-white py-3 rounded"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  )
}

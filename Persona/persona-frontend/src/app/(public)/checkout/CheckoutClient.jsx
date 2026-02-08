    "use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import api from "@/services/axios"
import { applyCoupon } from "@/services/checkout.service"

export default function CheckoutClient() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")

  const [items, setItems] = useState([])
  const [coupon, setCoupon] = useState("")
  const [discount, setDiscount] = useState(0)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (mode === "direct") {
      const productId = searchParams.get("productId")
      const qty = Number(searchParams.get("qty") || 1)
      loadSingleProduct(productId, qty)
    }

    if (mode === "cart") {
      loadCartProducts()
    }
  }, [mode])

  const loadSingleProduct = async (productId, qty) => {
    const { data } = await api.get(`/products/${productId}`)

    setItems([
      {
        id: data._id,
        name: data.name,
        price: data.basePrice,
        image: data.images?.[0],
        quantity: qty
      }
    ])
  }

  const loadCartProducts = async () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    if (!cart.length) return

    const productIds = cart.map(i => i.productId)
    const { data } = await api.post("/products/bulk", { productIds })

    setItems(
      data.map(p => {
        const cartItem = cart.find(c => c.productId === p._id)
        return {
          id: p._id,
          name: p.name,
          price: p.basePrice,
          image: p.images?.[0],
          quantity: cartItem.quantity
        }
      })
    )
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  )

  const DELIVERY_THRESHOLD = 10
  const DELIVERY_CHARGE = 2

  const deliveryCharge =
    subtotal > 0 && subtotal < DELIVERY_THRESHOLD
      ? DELIVERY_CHARGE
      : 0

  const discountAmount = (subtotal * discount) / 100
  const total = subtotal - discountAmount + deliveryCharge

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

  return (
    <div className="max-w-8xl bg-white mx-auto p-6 grid md:grid-cols-2 gap-10">
      
    </div>
  )
}

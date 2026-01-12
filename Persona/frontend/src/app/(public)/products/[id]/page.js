"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Heart, ShoppingCart, Plus, Minus } from "lucide-react"
import { getProductById } from "@/services/product.service"
import Link from "next/link"

export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [personalization, setPersonalization] = useState({})
  const [isInCart, setIsInCart] = useState(false)

  /* Fetch product */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id)
        setProduct(data)
      } catch (e) {
        console.error(e.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  /* Check cart (refresh-safe) */
  useEffect(() => {
    if (!product) return

    const cart = JSON.parse(localStorage.getItem("cart") || "[]")

    // No variant selected → any match
    if (!selectedSize && !selectedColor) {
      setIsInCart(cart.some(item => item.productId === product._id))
      return
    }

    // Variant selected → strict match
    setIsInCart(
      cart.some(
        item =>
          item.productId === product._id &&
          item.selectedVariants?.size === selectedSize &&
          item.selectedVariants?.color === selectedColor
      )
    )
  }, [product, selectedSize, selectedColor])

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")

    const existingIndex = cart.findIndex(
      item =>
        item.productId === product._id &&
        item.selectedVariants?.size === selectedSize &&
        item.selectedVariants?.color === selectedColor
    )

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity
    } else {
      cart.push({
        productId: product._id,
        name: product.name,
        price: product.basePrice,
        image: product.images?.[0],
        quantity,
        selectedVariants: {
          size: selectedSize,
          color: selectedColor
        },
        personalization
      })
    }

    localStorage.setItem("cart", JSON.stringify(cart))
    setIsInCart(true)
  }

  if (loading) return <p className="p-10 text-gray-500">Loading product...</p>
  if (!product) return <p className="p-10 text-red-500">Product not found</p>

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">

      {/* IMAGE */}
      <div className="relative w-full h-[420px] bg-gray-100 border">
        {product.images?.[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* INFO */}
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">{product.name}</h1>
        <div className="text-2xl font-bold">₹{product.basePrice}</div>

        {/* SIZE */}
        {product.variants?.sizes?.length > 0 && (
          <div>
            <p className="font-medium mb-2">Size</p>
            <div className="flex gap-2">
              {product.variants.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-3 py-1 border ${
                    selectedSize === size ? "bg-black text-white" : ""
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* COLOR */}
        {product.variants?.colors?.length > 0 && (
          <div>
            <p className="font-medium mb-2">Color</p>
            <div className="flex gap-2">
              {product.variants.colors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-3 py-1 border ${
                    selectedColor === color ? "bg-black text-white" : ""
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* QUANTITY */}
        <div>
          <p className="font-medium mb-2">Quantity</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="border p-2">
              <Minus size={16} />
            </button>
            <span className="w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} className="border p-2">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4 pt-6">
          {isInCart ? (
            <button
              onClick={() => router.push("/cart")}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white"
            >
              <ShoppingCart size={18} />
              Go to Cart
            </button>
          ) : (
            <button
              onClick={addToCart}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white"
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
          )}

          <Link href="/checkout" className="px-6 py-3 border">
            Buy Now
          </Link>

          <button className="p-3 border">
            <Heart size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

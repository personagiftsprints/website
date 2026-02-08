"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"

export default function ProductCard({
  slug,
  name,
  images = [],
  basePrice,
  specialPrice,
  rating = 0,
  reviewCount = 0,
  customizationEnabled = false
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [hovered, setHovered] = useState(false)

  const hasDiscount =
    specialPrice && specialPrice < basePrice

  const discountPercent = hasDiscount
    ? Math.round(((basePrice - specialPrice) / basePrice) * 100)
    : 0

  useEffect(() => {
    if (!hovered || images.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex(i => (i + 1) % images.length)
    }, 1200)

    return () => clearInterval(interval)
  }, [hovered, images.length])

  return (
    <Link href={`/products/${slug}`}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false)
          setActiveIndex(0)
        }}
        className="group bg-white border  overflow-hidden transition cursor-pointer"
      >
        {/* IMAGE */}
        <div className="relative aspect-square bg-gray-100">
          <img
            src={images[activeIndex]?.url}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Discount Badge */}
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
              {discountPercent}% OFF
            </span>
          )}

          {/* Customization Badge */}
          {customizationEnabled && (
            <span className="absolute bottom-3 left-3 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
              Customizable
            </span>
          )}
        </div>

        {/* DETAILS */}
        <div className="p-4 space-y-1">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
            {name}
          </h3>


          {/* Price */}
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-lg font-semibold text-gray-900">
                  ${specialPrice}
                </span>
                <span className="text-sm line-through text-gray-500">
                  ${basePrice}
                </span>
              </>
            ) : (
              <span className="text-lg font-semibold text-gray-900">
                ${basePrice}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

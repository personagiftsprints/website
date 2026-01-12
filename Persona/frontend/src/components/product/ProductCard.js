"use client"

import Image from "next/image"
import { Heart, Star } from "lucide-react"

export default function ProductCard({ product, onClick, onWishlist }) {
  if (!product) return null

  const {
    name,
    description,
    basePrice,      // actual price
    specialPrice,   // discounted price
    rating = 0,
    reviewCount = 0,
    images = []
  } = product

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer border bg-white overflow-hidden transition-all duration-300 hover:shadow-xl"
    >
      {/* IMAGE */}
      <div className="relative h-60 w-full bg-gray-100 overflow-hidden">
        {images[0] && (
          <Image
            src={images[0]}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        )}

        {/* WISHLIST */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onWishlist?.(product)
          }}
          className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 shadow transition"
        >
          <Heart size={18} className="text-gray-700 hover:text-red-500" />
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-2">
        {/* NAME */}
        <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
          {name}
        </h3>

        {/* RATING */}
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={
                  i < Math.round(rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }
              />
            ))}
          </div>
          <span>({reviewCount})</span>
        </div>

        {/* DESCRIPTION */}
        {description && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {description}
          </p>
        )}

        {/* PRICING */}
        <div className="flex items-end gap-2 pt-2">
          {specialPrice ? (
            <>
              {/* SPECIAL PRICE (PRIMARY) */}
              <span className="text-lg font-bold text-gray-900">
                ₹{specialPrice}
              </span>

              {/* ACTUAL PRICE (STRIKED) */}
              <span className="text-sm text-gray-500 line-through">
                ₹{basePrice}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              ₹{basePrice}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getEventBySlug } from "@/services/event.service"
import ProductCard from "@/components/product/ProductCard"

export default function EventPage() {
  const { slug } = useParams()

  const [eventData, setEventData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const res = await getEventBySlug(slug)
        if (res) {
          setEventData(res)
        }
      } catch (err) {
        console.error("Fetch event error:", err.message)
      } finally {
        setLoading(false)
      }
    }
    
    if (slug) fetchEvent()
  }, [slug])

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">
        Loading event details...
      </div>
    )
  }

  if (!eventData || !eventData.isActive) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Event Not Found</h1>
        <p className="text-gray-500">This event does not exist or has ended.</p>
      </div>
    )
  }

  const products = eventData.collectionRef?.productIds || []

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-[#f9a51b] capitalize mb-2">
          {eventData.title}
        </h1>
        {eventData.description && (
          <p className="text-gray-600 max-w-2xl">
            {eventData.description}
          </p>
        )}
      </div>

      {/* Empty Collection */}
      {products.length === 0 && (
        <div className="border border-dashed rounded-xl p-12 text-center text-gray-500">
          No products associated with this event yet.
        </div>
      )}

      {/* Product Grid */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {products.map(product => {
            // Check if product is populated or string ID
            if (typeof product === 'string') return null;
            
            return (
              <ProductCard
                key={product._id}
                slug={product.slug}
                name={product.name}
                images={product.images}
                basePrice={product.pricing?.basePrice}
                specialPrice={product.pricing?.specialPrice}
                rating={product.rating || 4.3}
                reviewCount={product.reviewCount || 120}
                customizationEnabled={product.customization?.enabled}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

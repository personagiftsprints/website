"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getProductById } from "@/services/product.service"
import { Pencil, CheckCircle2, EyeOff } from "lucide-react"

export default function ViewProductPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return

    setLoading(true)
    getProductById(id)
      .then(res => setProduct(res?.data || null))
      .catch(() => setError("Failed to load product"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading product…
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error || "Product not found"}
      </div>
    )
  }

  return (
    <div className="max-w-8xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {product.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            /{product.slug}
          </p>
        </div>

        <button
          onClick={() => router.push(`/admin/products/${id}`)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Pencil size={18} />
          Edit Product
        </button>
      </div>

      <div className="flex items-center gap-4">
        {product.isActive ? (
          <div className="inline-flex items-center gap-1.5 text-green-600 text-sm">
            <CheckCircle2 size={16} />
            Active
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-gray-500 text-sm">
            <EyeOff size={16} />
            Inactive
          </div>
        )}

        {product.customization?.enabled && (
          <span className="px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">
            Customization Enabled
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold mb-3">Product Images</h2>

          {product.images?.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {product.images.map(img => (
                <div
                  key={img.publicId || img.url}
                  className={`border rounded-lg overflow-hidden ${
                    img.isMain ? "border-indigo-500" : "border-gray-200"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={product.name}
                    className="w-full aspect-square object-cover"
                  />
                  {img.isMain && (
                    <div className="text-xs text-center py-1 bg-indigo-50 text-indigo-600">
                      Main Image
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400">No images available</div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1 text-gray-800">
              {product.description || "—"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Base Price</h3>
              <p className="mt-1 font-semibold">
                {product.pricing?.basePrice != null
                  ? `$${product.pricing.basePrice}`
                  : "—"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Special Price</h3>
              <p className="mt-1 font-semibold">
                {product.pricing?.specialPrice
                  ? `$${product.pricing.specialPrice}`
                  : "—"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Stock Quantity</h3>
              <p className="mt-1 font-semibold">
                {product.inventory?.stockQuantity ?? "—"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Material</h3>
              <p className="mt-1 font-semibold">
                {product.material || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

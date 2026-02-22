"use client"

import { getProductBySku } from "@/services/product.service"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

export default function StockManagementPage() {
  const { sku } = useParams()
  const router = useRouter()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sku) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        const result = await getProductBySku(sku)
        setData(result.data)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [sku])

  if (!sku) {
    return <div className="p-6">Invalid SKU.</div>
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!data) {
    return <div className="p-6">Product not found.</div>
  }

  const { product, matchedVariant, isVariant } = data

  const stock = isVariant
    ? matchedVariant?.stockQuantity
    : product.inventory?.stockQuantity

  const threshold = product.inventory?.lowStockThreshold

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Stock Details
      </h1>

      <div className="border p-4 rounded space-y-2">

  <div className="w-32 h-32 shrink-0">
    <img
      src={product.thumbnail}
      alt={product.name}
      className="w-full h-full object-cover rounded border border-gray-200"
    />
  </div>
        <div className="font-semibold text-lg">
          {product.name}
        </div>

        <div className="font-mono">
          SKU: {sku}
        </div>

        <div>
          Stock: {stock}
        </div>

        <div>
          Threshold: {threshold}
        </div>

        <div>
          Status:{" "}
          {stock <= threshold ? (
            <span className="text-red-600 font-semibold">
              Low
            </span>
          ) : (
            <span className="text-green-600 font-semibold">
              OK
            </span>
          )}
        </div>

        <button
          onClick={() =>
            router.push(`/admin/manage-stock/edit/${product._id}`)
          }
          className="mt-4 border px-3 py-1 rounded"
        >
          Edit Stock
        </button>
      </div>
    </div>
  )
}
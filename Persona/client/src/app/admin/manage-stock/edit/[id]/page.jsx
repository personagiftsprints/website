"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getProductById, updateProductAPI } from "@/services/product.service"

export default function EditStockPage() {
  const { id } = useParams()
  console.log(id)
  const router = useRouter()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [stockQuantity, setStockQuantity] = useState(0)
  const [lowStockThreshold, setLowStockThreshold] = useState(10)

  useEffect(() => {
    if (!id) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        const result = await getProductById(id)
        const p = result.data

        setProduct(p)
        setStockQuantity(p.inventory?.stockQuantity || 0)
        setLowStockThreshold(p.inventory?.lowStockThreshold || 10)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleSave = async () => {
    try {
      setSaving(true)

      await updateProductAPI(id, {
        inventory: {
          ...product.inventory,
          stockQuantity: Number(stockQuantity),
          lowStockThreshold: Number(lowStockThreshold)
        }
      })

      router.push(`/admin/manage-stock/${product.sku}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!product) {
    return <div className="p-6">Product not found.</div>
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-semibold mb-6">
        Edit Stock
      </h1>

      <div className="space-y-4 border p-4 rounded">
        <div>
          <div className="text-sm text-gray-500">
            Product
          </div>
          <div className="font-semibold">
            {product.name}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">
            Stock Quantity
          </label>
          <input
            type="number"
            value={stockQuantity}
            onChange={(e) =>
              setStockQuantity(e.target.value)
            }
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">
            Low Stock Threshold
          </label>
          <input
            type="number"
            value={lowStockThreshold}
            onChange={(e) =>
              setLowStockThreshold(e.target.value)
            }
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 border px-4 py-2 rounded w-full"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
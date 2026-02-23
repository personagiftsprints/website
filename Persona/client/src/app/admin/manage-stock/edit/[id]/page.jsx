"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getProductById, updateProductAPI } from "@/services/product.service"

export default function EditStockPage() {
  const { id } = useParams()
  const router = useRouter()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [baseStock, setBaseStock] = useState(0)
  const [lowStockThreshold, setLowStockThreshold] = useState(10)
  const [variants, setVariants] = useState([])

  useEffect(() => {
    if (!id) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        const result = await getProductById(id)
        const p = result.data

        setProduct(p)

        const hasVariants =
          Array.isArray(p.productConfig?.variants) &&
          p.productConfig.variants.length > 0

        if (hasVariants) {
          setVariants(p.productConfig.variants)
        } else {
          setBaseStock(p.inventory?.stockQuantity || 0)
        }

        setLowStockThreshold(p.inventory?.lowStockThreshold || 10)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleVariantChange = (index, value) => {
    const updated = [...variants]
    updated[index].stockQuantity = Number(value)
    setVariants(updated)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const hasVariants = variants.length > 0

      const payload = hasVariants
        ? {
            productConfig: {
              ...product.productConfig,
              variants
            },
            inventory: {
              ...product.inventory,
              manageStock: false,
              lowStockThreshold: Number(lowStockThreshold)
            }
          }
        : {
            inventory: {
              ...product.inventory,
              stockQuantity: Number(baseStock),
              lowStockThreshold: Number(lowStockThreshold)
            }
          }

      await updateProductAPI(id, payload)

      router.push(`/admin/manage-stock/${product.sku}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!product) return <div className="p-6">Product not found.</div>

  const hasVariants = variants.length > 0

  return (
    <div className="p-6 max-w-xl space-y-6">

      <h1 className="text-2xl font-semibold">
        Edit Stock
      </h1>

      <div className="flex items-center gap-4 border p-3 rounded">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="w-14 h-14 object-cover rounded border"
        />
        <div className="font-semibold">
          {product.name}
        </div>
      </div>

      <div className="border p-4 rounded space-y-4">

        {hasVariants ? (
          <div className="space-y-3">
            <div className="font-medium text-sm">
              Variant Stock
            </div>

            {variants
              .filter(v => v.stockQuantity > 0 || true)
              .map((v, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center gap-4"
                >
                  <div className="text-sm">
                    {Object.values(v.attributes).join(" / ")}
                  </div>

                  <input
                    type="number"
                    min="0"
                    value={v.stockQuantity}
                    onChange={(e) =>
                      handleVariantChange(i, e.target.value)
                    }
                    className="border px-2 py-1 w-24 rounded text-center"
                  />
                </div>
              ))}
          </div>
        ) : (
          <div>
            <label className="block text-sm mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              min="0"
              value={baseStock}
              onChange={(e) => setBaseStock(e.target.value)}
              className="border px-3 py-2 rounded w-full"
            />
          </div>
        )}

        <div>
          <label className="block text-sm mb-1">
            Low Stock Threshold
          </label>
          <input
            type="number"
            min="0"
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
          className="mt-2 border px-4 py-2 rounded w-full"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
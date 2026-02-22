"use client"

import { getStockManagement } from "@/services/product.service"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"

export default function StockManagementPage() {
  const router = useRouter()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [sku, setSku] = useState("")
  const [lowStock, setLowStock] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const result = await getStockManagement({
        sku,
        lowStock,
        page,
        limit: 20
      })
      console.log(result)
      setData(result.data)
      setPagination(result.pagination)
    } catch (error) {
      console.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, lowStock])

  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1)
      fetchData()
    }, 400)
    return () => clearTimeout(delay)
  }, [sku])

  const rows = useMemo(() => {
    const flattened = []

    data.forEach((product) => {
      const threshold = product.inventory?.lowStockThreshold || 0

      if (product.productConfig?.variants?.length) {
        product.productConfig.variants.forEach((variant) => {
          flattened.push({
            productId: product._id,
            name: product.name,
            type: product.type,
            sku: variant.sku,
            stock: variant.stockQuantity,
            attributes: variant.attributes,
            isLow: variant.stockQuantity <= threshold
          })
        })
      } else {
        flattened.push({
          productId: product._id,
          name: product.name,
          type: product.type,
          sku: product.sku || "—",
          stock: product.inventory?.stockQuantity ?? 0,
          attributes: null,
          isLow: product.isLowStock
        })
      }
    })

    return flattened
  }, [data])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Stock Management</h1>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by SKU"
          value={sku}
          onChange={(e) => setSku(e.target.value.toLowerCase())}
          className="border px-4 py-2 rounded w-64"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => {
              setPage(1)
              setLowStock(e.target.checked)
            }}
          />
          Low Stock Only
        </label>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Product</th>
              <th className="p-3 border">Attributes</th>
              <th className="p-3 border">SKU</th>
              <th className="p-3 border">Type</th>
              <th className="p-3 border">Stock</th>
              <th className="p-3 border">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center">
                  No products found
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((row) => (
                <tr
                  key={`${row.productId}-${row.sku}`}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/admin/manage-stock/${row.sku}`
                    )
                  }
                >
                  <td className="p-3 border font-medium">
                    {row.name}
                  </td>

                  <td className="p-3 border text-sm text-gray-600">
                    {row.attributes
                      ? Object.entries(row.attributes)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")
                      : "—"}
                  </td>

                  <td className="p-3 border font-mono">
                    {row.sku}
                  </td>

                  <td className="p-3 border">
                    {row.type}
                  </td>

                  <td className="p-3 border">
                    {row.stock}
                  </td>

                  <td className="p-3 border">
                    {row.isLow ? (
                      <span className="text-red-600 font-semibold">
                        Low
                      </span>
                    ) : (
                      <span className="text-green-600 font-semibold">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span>
          Page {pagination.page} of {pagination.pages}
        </span>

        <button
          disabled={page === pagination.pages}
          onClick={() => setPage((prev) => prev + 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
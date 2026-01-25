"use client"

import { useEffect, useState } from "react"
import {
  Package,
  Pencil,
  EyeOff,
  Eye,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { getAllProducts, updateProductStatus } from "@/services/product.service"

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  const fetchProducts = async (pageNumber = 1) => {
    try {
      setLoading(true)
      const data = await getAllProducts({ page: pageNumber, limit: 20 })
      setProducts(Array.isArray(data?.data) ? data.data : [])
      setPage(data?.pagination?.page || 1)
      setTotalPages(data?.pagination?.pages || 1)
    } finally {
      setLoading(false)
    }
  }

  const toggleProductStatus = async (product) => {
    await updateProductStatus(product._id, !product.isActive)
    setOpenMenuId(null)
    fetchProducts(page)
  }

  useEffect(() => {
    fetchProducts(1)
  }, [])

  const filteredProducts = products
    .filter(p => {
      if (filter === "active") return p.isActive
      if (filter === "inactive") return !p.isActive
      if (filter === "low-stock") return p.inventory.stockQuantity <= 10
      return true
    })
    .filter(p =>
      (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt)
      if (sortBy === "name") return a.name.localeCompare(b.name)
      return 0
    })

  const statusClass = isActive =>
    isActive
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-gray-100 text-gray-700 border-gray-200"

  return (
    <div className="min-h-screen bg-white px-6 py-8 max-w-8xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-sm text-gray-500">Manage your catalog</p>
        </div>

        <Link href="/admin/products/create">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Package size={18} /> Add Product
          </button>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border rounded-xl p-4 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {["all", "active", "inactive", "low-stock"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm ${
                filter === f
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {f.replace("-", " ")}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16">Loading…</div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                <th className="px-6 py-4 text-left">Product</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredProducts.map(product => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/products/${product._id}`}
                      className="font-semibold hover:text-indigo-600"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-gray-500">{product.slug}</p>
                  </td>

                  <td className="px-6 py-4 text-center">
                    {product.inventory.stockQuantity}
                  </td>

                  <td className="px-6 py-4 text-center font-medium">
                    ${product.pricing.specialPrice ?? product.pricing.basePrice}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full border text-xs ${statusClass(product.isActive)}`}>
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/products/view/${product._id}`}
                        className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        View
                      </Link>

                      <Link
                        href={`/admin/products/${product._id}`}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </Link>

                      <button
                        onClick={() => toggleProductStatus(product)}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Toggle status"
                      >
                        {product.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
            <button
              disabled={page === 1}
              onClick={() => fetchProducts(page - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => fetchProducts(page + 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

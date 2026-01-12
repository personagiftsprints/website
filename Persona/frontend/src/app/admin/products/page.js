"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import {
  Package,
  Pencil,
  EyeOff,
  Palette,
  Layers,
  Plus,
  MoreVertical
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import {
  getAllProducts,
  deactivateProduct as deactivateProductApi
} from "@/services/product.service"




export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState(null)

const fetchProducts = async (pageNumber = 1) => {
  try {
    setLoading(true)

    const data = await getAllProducts({
      page: pageNumber,
      limit: 13
    })

    setProducts(Array.isArray(data?.products) ? data.products : [])
    setPage(data?.page || 1)
    setTotalPages(data?.totalPages || 1)
  } catch (err) {
    console.error(err.message)
    setProducts([]) // 🔒 guarantee array
  } finally {
    setLoading(false)
  }
}


const deactivateProduct = async (id) => {
  try {
    await deactivateProductApi(id)
    setOpenMenuId(null)
    fetchProducts(page)
  } catch (err) {
    console.error(err.message)
  }
}


  useEffect(() => {
    fetchProducts(1)
  }, [])

  return (
    <div
      className="max-w-8xl mx-auto px-6 py-0 space-y-6"
      onClick={() => setOpenMenuId(null)}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manage Products</h1>
          <p className="text-gray-500 text-sm">
            View, edit, or deactivate products
          </p>
        </div>

        <Link href="/admin/products/create">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-900">
            <Plus size={18} />
            Create Product
          </button>
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="border rounded-lg p-10 text-center text-gray-500">
          No products found
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Variants</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map(product => (
                <tr
                  key={product._id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] && (
                        <Image
                          src={product.images[0]}
                          width={40}
                          height={40}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}

                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          {product.itemType}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        product.productType === "personalized"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {product.productType}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {product.category}
                  </td>

                  <td className="px-4 py-3">
                    ₹{product.basePrice}
                  </td>

                  <td className="px-4 py-3 text-sm space-y-1">
                    {product.variants?.sizes?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Layers size={14} />
                        <span>
                          Sizes: {product.variants.sizes.join(", ")}
                        </span>
                      </div>
                    )}
                    {product.variants?.colors?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Palette size={14} />
                        <span>
                          Colors: {product.variants.colors.join(", ")}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 relative">
                    <div className="flex justify-end">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setOpenMenuId(
                            openMenuId === product._id
                              ? null
                              : product._id
                          )
                        }}
                        className="p-2 rounded hover:bg-gray-100"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>

                    {openMenuId === product._id && (
                      <div
                        className="absolute right-4 mt-2 w-40 bg-white border shadow-lg z-20"
                        onClick={e => e.stopPropagation()}
                      >
                        <Link href={`/admin/products/${product._id}`}>
                          <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100">
                            <Pencil size={14} />
                            Edit
                          </button>
                        </Link>

                        <button
                          onClick={() => deactivateProduct(product._id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <EyeOff size={14} />
                          Deactivate
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
            <button
              disabled={page === 1}
              onClick={() => fetchProducts(page - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
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

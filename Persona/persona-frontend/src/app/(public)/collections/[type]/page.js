"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getProductsByType } from "@/services/product.service"
import ProductCard from "@/components/product/ProductCard"

export default function CollectionByTypePage() {
  const { type } = useParams()

  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchProducts = async (pageNumber = 1) => {
    try {
      setLoading(true)
      const res = await getProductsByType(type, {
        page: pageNumber,
        limit: 20
      })

      setProducts(res.data || [])
      setPage(res.pagination.page)
      setTotalPages(res.pagination.pages)
    } catch (err) {
      console.error("Fetch collection error:", err.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchProducts(1)
  }, [type])

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold capitalize">
          {type.replace("-", " ")} Collection
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Browse our {type.replace("-", " ")} products
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20 text-gray-500">
          Loading products...
        </div>
      )}

      {/* Empty */}
      {!loading && products.length === 0 && (
        <div className="border border-dashed rounded-xl p-12 text-center text-gray-500">
          No products found in this collection.
        </div>
      )}

      {/* Product Grid */}
      {!loading && products.length > 0 && (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
  {products.map(product => (
    <ProductCard
      key={product._id}
      slug={product.slug}
      name={product.name}
      images={product.images}
      basePrice={product.pricing.basePrice}
      specialPrice={product.pricing.specialPrice}
      rating={product.rating || 4.3}
      reviewCount={product.reviewCount || 120}
      customizationEnabled={product.customization?.enabled}
    />
  ))}
</div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8">
          <button
            disabled={page === 1}
            onClick={() => fetchProducts(page - 1)}
            className="px-5 py-2 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-100"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => fetchProducts(page + 1)}
            className="px-5 py-2 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

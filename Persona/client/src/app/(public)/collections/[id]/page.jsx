"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getCollectionById } from "@/services/collection.service"

export default function CollectionProductsPage() {
  const { id } = useParams()


  console.log(id)

  const [collection, setCollection] = useState(null)
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchCollection = async (pageNumber = 1) => {
    try {
      setLoading(true)

      const res = await getCollectionById(id, {
        page: pageNumber,
        limit: 20
      })

      if (res.success) {
        setCollection(res.data)
        setProducts(res.data.products || [])
        setPage(res.data.pagination?.page || 1)
        setPages(res.data.pagination?.pages || 1)
      }
    } catch (err) {
      console.error("Collection fetch failed", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchCollection(1)
  }, [id])

  if (loading) {
    return (
      <div className="p-12 text-center">
        Loading collection...
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="p-12 text-center text-red-500">
        Collection not found
      </div>
    )
  }

  return (
    <div className="p-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold">
          {collection.title}
        </h1>

        {collection.description && (
          <p className="text-gray-600 mt-2">
            {collection.description}
          </p>
        )}
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-gray-500">
          No products available.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map(product => (
            <div
              key={product._id}
              className="border border-gray-300 rounded-lg p-4 hover:shadow transition"
            >
              {product.thumbnail && (
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="w-full h-44 object-cover rounded mb-3"
                />
              )}

              <div className="font-medium mb-1">
                {product.name}
              </div>

              <div className="text-sm text-gray-500">
                £{product.pricing?.basePrice}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            disabled={page <= 1}
            onClick={() => fetchCollection(page - 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span>
            Page {page} of {pages}
          </span>

          <button
            disabled={page >= pages}
            onClick={() => fetchCollection(page + 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

    </div>
  )
}
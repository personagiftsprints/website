"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getCollectionById } from "@/services/collection.service"

export default function CollectionPage() {
  const { id } = useParams()

  const [collection, setCollection] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await getCollectionById(id)

        if (res.success) {
          setCollection(res.data)
          setProducts(res.data.products || [])
        }
      } catch (err) {
        console.error("Failed to load collection", err)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchCollection()
  }, [id])

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading collection...
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="p-10 text-center text-red-500">
        Collection not found
      </div>
    )
  }

  return (
    <div className="p-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {collection.title}
        </h1>

        {collection.description && (
          <p className="text-gray-600 mt-2">
            {collection.description}
          </p>
        )}
      </div>

    {/* Products Table */}
{products.length === 0 ? (
  <div className="text-gray-500">
    No products available in this collection.
  </div>
) : (
  <div className="border rounded overflow-hidden">
    <table className="w-full">

      <thead className="bg-gray-100 border-b">
        <tr>
          <th className="text-left p-3">Image</th>
          <th className="text-left p-3">Name</th>
          <th className="text-left p-3">SKU</th>
          <th className="text-left p-3">Type</th>
          <th className="text-left p-3">Price</th>
         
        </tr>
      </thead>

      <tbody>
        {products.map(product => (
          <tr key={product._id} className="border-b hover:bg-gray-50">

            <td className="p-3">
              {product.thumbnail && (
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
            </td>

            <td className="p-3 font-medium">
              {product.name}
            </td>

            <td className="p-3 text-sm text-gray-600">
              {product.sku}
            </td>

            <td className="p-3 capitalize">
              {product.type}
            </td>

            <td className="p-3">
              £{product.pricing?.basePrice}
            </td>

           

          </tr>
        ))}
      </tbody>

    </table>
  </div>
)}

    </div>
  )
}
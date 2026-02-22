"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAllCollections } from "@/services/collection.service"

export default function CollectionsListingPage() {
  const router = useRouter()

  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await getAllCollections(1, 100)

        if (res.success) {
          setCollections(
            res.data.filter(c => c.isActive)
          )
        }
      } catch (err) {
        console.error("Failed to fetch collections", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [])

  if (loading) {
    return (
      <div className="p-12 text-center">
        Loading collections...
      </div>
    )
  }

  if (collections.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        No collections available.
      </div>
    )
  }

  return (
    <div className="lg:p-10 px-6 max-w-7xl mx-auto">

      <h1 className="text-3xl font-bold mb-10">
        Collections
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-8">

        {collections.map(collection => (
          <div
            key={collection._id}
            onClick={() =>
              router.push(`/collections/${collection._id}`)
            }
            className="cursor-pointer border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition"
          >

            {collection.image?.url && (
              <img
                src={collection.image.url}
                alt={collection.title}
                className="w-full h-56 object-cover"
              />
            )}

            <div className="p-5">
              <h2 className="text-xl font-semibold mb-2">
                {collection.title}
              </h2>

              {collection.description && (
                <p className="text-gray-600 text-sm line-clamp-3">
                  {collection.description}
                </p>
              )}
            </div>

          </div>
        ))}

      </div>
    </div>
  )
}
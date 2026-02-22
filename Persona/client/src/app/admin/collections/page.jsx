"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getAllCollections, deleteCollection } from "@/services/collection.service"

export default function CollectionsPage() {
  const router = useRouter()

  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await getAllCollections(1, 50)

        if (response.success) {
          setCollections(response.data)
        } else {
          setCollections([])
        }
      } catch (error) {
        console.error("Failed to load collections", error)
        setCollections([])
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [])

  const handleOpenCollection = (collection) => {
    const url = collection.slug
      ? `/admin/collections/${collection.slug}`
      : `/admin/collections/${collection._id}`

    window.open(url, "_blank")
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()

    const confirmDelete = confirm("Are you sure you want to delete this collection?")
    if (!confirmDelete) return

    try {
      setDeletingId(id)

      const res = await deleteCollection(id)

      if (res.success) {
        setCollections(prev =>
          prev.filter(c => c._id !== id)
        )
      } else {
        alert("Failed to delete collection")
      }
    } catch (err) {
      console.error(err)
      alert("Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          Collections
        </h1>

        <button
          onClick={() => router.push("/admin/collections/create")}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          Create Collection
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : collections.length === 0 ? (
        <p className="text-gray-500">No collections found.</p>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full">

            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Created</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {collections.map((collection) => (
                <tr
                  key={collection._id}
                  onClick={() => handleOpenCollection(collection)}
                  className="border-b cursor-pointer hover:bg-gray-50 transition"
                >
                  <td className="p-3 font-medium">
                    {collection.title}
                  </td>

                  <td className="p-3">
                    {collection.type}
                  </td>

                  <td className="p-3">
                    {collection.isActive ? (
                      <span className="text-green-600 font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-500">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-sm text-gray-500">
                    {new Date(collection.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={(e) => handleDelete(e, collection._id)}
                      disabled={deletingId === collection._id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === collection._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
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
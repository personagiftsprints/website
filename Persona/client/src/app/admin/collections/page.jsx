"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Eye, EyeOff, Trash2 } from "lucide-react"
import { getAllCollections, deleteCollection, toggleCollectionStatus } from "@/services/collection.service"

export default function CollectionsPage() {
  const router = useRouter()

  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await getAllCollections(1, 100)

        if (response?.data) {
          setCollections(response.data.data || response.data)
        } else if (response?.success) {
           setCollections(response.data)
        } else {
           setCollections(response)
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

  const reloadCollections = async () => {
    try {
      const response = await getAllCollections(1, 100)
      if (response?.data) {
          setCollections(response.data.data || response.data)
      } else if (response?.success) {
          setCollections(response.data)
      } else {
          setCollections(response)
      }
    } catch (error) {
       console.error(error)
    }
  }

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

      if (res?.data?.success || res?.success || res?.status === 200) {
        setCollections(prev => {
          let arr = Array.isArray(prev) ? prev : (prev.data || prev.data?.data || [])
          return arr.filter(c => c._id !== id)
        })
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

  const handleToggleStatus = async (e, id) => {
    e.stopPropagation()
    try {
      await toggleCollectionStatus(id)
      reloadCollections()
    } catch (error) {
      alert("Error toggling collection status")
    }
  }

  // Helper to ensure collections is mapped properly
  const cols = Array.isArray(collections) ? collections : (collections?.data?.data || collections?.data || [])


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
              {cols.map((collection) => (
                <tr
                  key={collection._id}
                  onClick={() => handleOpenCollection(collection)}
                  className="border-b cursor-pointer hover:bg-gray-50 transition"
                >
                  <td className="p-3 font-medium">
                    {collection.title}
                  </td>

                  <td className="p-3">
                    {collection.type === 'PRODUCT_TYPE' ? 'Product Type' : 'Manual'}
                  </td>

                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${collection.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {collection.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>

                  <td className="p-3 text-sm text-gray-500">
                    {new Date(collection.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-3 flex items-center space-x-3">
                    <button
                      onClick={(e) => handleToggleStatus(e, collection._id)}
                      className={`${collection.isActive !== false ? 'text-gray-500 hover:text-gray-700' : 'text-green-500 hover:text-green-700'}`}
                      title={collection.isActive !== false ? "Disable" : "Enable"}
                    >
                      {collection.isActive !== false ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    
                    <button
                      onClick={(e) => handleDelete(e, collection._id)}
                      disabled={deletingId === collection._id}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === collection._id ? "..." : <Trash2 size={18} />}
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
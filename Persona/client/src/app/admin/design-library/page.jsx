"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { getAllDesigns, deleteDesign } from "@/services/design.service"
import { Trash2, Edit, ExternalLink, RefreshCw } from "lucide-react"

export default function DesignLibraryPage() {
  const [designs, setDesigns] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchDesigns = async () => {
    try {
      setIsLoading(true)
      const res = await getAllDesigns()
      setDesigns(res.data || [])
    } catch (err) {
      console.error("Failed to fetch designs:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDesigns()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this design?")) return

    try {
      setIsDeleting(true)
      await deleteDesign(id)
      setDesigns(prev => prev.filter(d => d._id !== id))
      alert("Design deleted successfully")
    } catch (err) {
      console.error("Delete failed:", err)
      alert("Failed to delete design")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Design Library</h1>
          <p className="text-sm text-gray-500">Manage predefined designs for the customization studio</p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={fetchDesigns}
            disabled={isLoading}
            className="p-2 border rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/admin/design-library/add"
            className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
          >
            <span>+</span> Add New Design
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
            <p className="text-gray-500 font-medium">Loading designs...</p>
          </div>
        ) : designs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="text-5xl">🖼️</div>
            <h3 className="text-lg font-bold text-gray-700">No designs found</h3>
            <p className="text-gray-500 max-w-xs">Start building your library by adding professional designs for your products.</p>
            <Link
              href="/admin/design-library/add"
              className="mt-2 text-blue-600 font-bold hover:underline"
            >
              Add your first design →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left">
                  <th className="px-6 py-4 font-bold text-gray-700">Preview</th>
                  <th className="px-6 py-4 font-bold text-gray-700">Design Name</th>
                  <th className="px-6 py-4 font-bold text-gray-700">Product Type</th>
                  <th className="px-6 py-4 font-bold text-gray-700">Tags</th>
                  <th className="px-6 py-4 font-bold text-gray-700">Status</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {designs.map((design) => (
                  <tr
                    key={design._id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="relative h-16 w-16 bg-gray-100 rounded-lg overflow-hidden border shadow-sm group-hover:shadow-md transition-all">
                        <Image
                          src={design.imageUrl}
                          alt={design.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{design.name}</p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-mono">{design._id}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="capitalize bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-xs font-semibold">
                        {design.productType}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {design.metadata?.tags?.length > 0 ? (
                          design.metadata.tags.map((tag, i) => (
                            <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-300 italic text-xs">No tags</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5 ${
                          design.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600 shadow-sm"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${design.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        {design.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a 
                          href={design.imageUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Original"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <Link
                          href={`/admin/design-library/edit/${design._id}`}
                          className="p-2 text-gray-400 hover:text-black transition-colors"
                          title="Edit Design"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(design._id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Design"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
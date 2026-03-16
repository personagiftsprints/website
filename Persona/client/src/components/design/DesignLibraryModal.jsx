"use client"
import { useState, useEffect } from "react"
import { getDesignsByProductType } from "@/services/design.service"
import { getCategories } from "@/services/category.service"
import { X, Search, CheckCircle, Filter } from "lucide-react"

export default function DesignLibraryModal({ 
  productType, 
  onSelect, 
  onClose,
  currentDesignUrl 
}) {
  const [designs, setDesigns] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedDesign, setSelectedDesign] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await getCategories({ activeOnly: true })
      setCategories(res.data || [])
    } catch (err) {
      console.error("Failed to fetch categories", err)
    }
  }

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true)
        const res = await getDesignsByProductType(productType)
        if (res.success) {
          setDesigns(res.data)
        }
      } catch (err) {
        console.error("Failed to fetch designs:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDesigns()
  }, [productType])

  const filteredDesigns = designs.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.metadata?.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || d.category === selectedCategory || (d.category?._id === selectedCategory)
    
    return matchesSearch && matchesCategory
  })

  const handleSelect = (design) => {
    setSelectedDesign(design)
  }

  const handleConfirm = () => {
    if (selectedDesign) {
      onSelect(selectedDesign)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Design Library</h2>
            <p className="text-sm text-gray-500">Choose a professional design for your {productType}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b flex flex-col md:flex-row gap-4 bg-white">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search designs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
            />
          </div>

          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black appearance-none outline-none transition-all bg-white font-medium text-gray-700"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Loading designs...</p>
            </div>
          ) : filteredDesigns.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredDesigns.map((design) => {
                const isSelected = selectedDesign?._id === design._id
                const isCurrent = currentDesignUrl === design.imageUrl

                return (
                  <div 
                    key={design._id}
                    onClick={() => handleSelect(design)}
                    className={`group relative cursor-pointer rounded-xl border-2 transition-all overflow-hidden ${
                      isSelected 
                        ? "border-blue-600 shadow-blue-100 shadow-lg scale-[1.02]" 
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="aspect-square bg-gray-50 p-4">
                      <img 
                        src={design.imageUrl} 
                        alt={design.name}
                        className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-110"
                      />
                    </div>
                    <div className="p-3 bg-white">
                      <p className="text-sm font-semibold text-gray-800 truncate">{design.name}</p>
                      {design.metadata?.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1 overflow-hidden">
                          {design.metadata.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 text-blue-600 bg-white rounded-full">
                        <CheckCircle size={24} fill="white" />
                      </div>
                    )}
                    
                    {isCurrent && !isSelected && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        CURRENT
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <Search size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">No designs found</h3>
              <p className="text-gray-500 mt-1">Try a different search term or check back later.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 font-semibold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={!selectedDesign}
            onClick={handleConfirm}
            className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-md ${
              selectedDesign 
                ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Save Design
          </button>
        </div>
      </div>
    </div>
  )
}

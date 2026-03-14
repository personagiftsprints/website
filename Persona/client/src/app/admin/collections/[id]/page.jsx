"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getCollectionById, updateCollection } from "@/services/collection.service"
import { searchProducts } from "@/services/product.service"
import { Trash2, Plus, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function CollectionPage() {
  const { id } = useParams()

  const [collection, setCollection] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchCollection = async () => {
    try {
      const res = await getCollectionById(id)
      if (res.success) {
        setCollection(res.data)
        setProducts(res.data.products || [])
      }
    } catch (err) {
      console.error("Failed to load collection", err)
      toast.error("Failed to load collection")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchCollection()
  }, [id])

  const handleSearch = async (e) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const res = await searchProducts(query)
      // Filter out products already in the collection
      const existingIds = products.map(p => p._id)
      const filteredResults = (res.data || []).filter(p => !existingIds.includes(p._id))
      setSearchResults(filteredResults)
    } catch (err) {
      console.error("Search failed", err)
    } finally {
      setSearching(false)
    }
  }

  const handleAddProduct = async (product) => {
    if (updating) return
    setUpdating(true)
    try {
      const updatedProductIds = [...products.map(p => p._id), product._id]
      const res = await updateCollection(id, { 
        productIds: updatedProductIds,
        type: collection.type 
      })
      
      if (res.success) {
        toast.success("Product added to collection")
        // Refresh collection data
        await fetchCollection()
        setSearchQuery("")
        setSearchResults([])
      }
    } catch (err) {
      console.error("Failed to add product", err)
      toast.error("Failed to add product")
    } finally {
      setUpdating(false)
    }
  }

  const handleRemoveProduct = async (productId) => {
    if (!confirm("Are you sure you want to remove this product from the collection?")) return
    if (updating) return
    
    setUpdating(true)
    try {
      const updatedProductIds = products
        .filter(p => p._id !== productId)
        .map(p => p._id)
      
      const res = await updateCollection(id, { 
        productIds: updatedProductIds,
        type: collection.type
      })
      
      if (res.success) {
        toast.success("Product removed from collection")
        await fetchCollection()
      }
    } catch (err) {
      console.error("Failed to remove product", err)
      toast.error("Failed to remove product")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
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
    <div className="p-4 md:p-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {collection.title}
            </h1>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              collection.type === 'MANUAL' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {collection.type === 'MANUAL' ? 'Manual Collection' : 'Automatic Collection'}
            </span>
          </div>
          {collection.description && (
            <p className="text-gray-600">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* Add Product Section - Only for MANUAL collections */}
      {collection.type === 'MANUAL' && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus size={20} className="text-orange-500" />
            Add Product to Collection
          </h2>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={handleSearch}
            />
            
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 border rounded-xl overflow-hidden divide-y bg-gray-50 max-h-60 overflow-y-auto">
              {searchResults.map(p => (
                <div key={p._id} className="p-3 flex items-center justify-between hover:bg-white transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={p.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.sku}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddProduct(p)}
                    disabled={updating}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold">Products in Collection ({products.length})</h2>
          {collection.type === 'PRODUCT_TYPE' && (
            <p className="text-xs text-gray-500 mt-1">This is an automatic collection based on product types: {collection.productTypes.join(", ")}</p>
          )}
        </div>
        
        {products.length === 0 ? (
          <div className="p-20 text-center text-gray-500">
            No products available in this collection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Product</th>
                  <th className="text-left p-4 font-semibold text-sm">SKU</th>
                  <th className="text-left p-4 font-semibold text-sm">Type</th>
                  <th className="text-left p-4 font-semibold text-sm">Price</th>
                  {collection.type === 'MANUAL' && (
                    <th className="text-right p-4 font-semibold text-sm">Action</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y">
                {products.map(product => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.thumbnail && (
                          <img
                            src={product.thumbnail}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border shadow-sm"
                          />
                        )}
                        <span className="font-semibold text-gray-900">{product.name}</span>
                      </div>
                    </td>

                    <td className="p-4 text-sm text-gray-600">
                      {product.sku}
                    </td>

                    <td className="p-4 text-sm">
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize text-xs font-medium">
                        {product.type}
                      </span>
                    </td>

                    <td className="p-4 text-sm font-medium text-gray-900">
                      £{product.pricing?.basePrice}
                    </td>

                    {collection.type === 'MANUAL' && (
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleRemoveProduct(product._id)}
                          disabled={updating}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center disabled:opacity-50"
                          title="Remove from collection"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
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
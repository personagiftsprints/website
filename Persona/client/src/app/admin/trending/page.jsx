"use client"

import { useState, useEffect } from "react"
import { getSettings, updateSettings } from "@/services/settings.service"
import { getAllProducts, toggleTrendingAPI, TrendingProducts, updateProductStatus } from "@/services/product.service"
import { Save, Info, Search, Star, Loader2, ArrowLeft, CheckCircle2, LayoutGrid, XCircle, AlertCircle, Power } from "lucide-react"
import Link from "next/link"

export default function TrendingAdminPage() {
  const [settings, setSettings] = useState(null)
  const [products, setProducts] = useState([])
  const [currentlyTrending, setCurrentlyTrending] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [updatingMode, setUpdatingMode] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const settingsRes = await getSettings()
      setSettings(settingsRes.data)
      
      const trendingRes = await TrendingProducts()
      setCurrentlyTrending(trendingRes.trending || [])
    } catch (err) {
      console.error("Failed to load trending data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [searchQuery])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const res = await getAllProducts({ search: searchQuery, limit: 12 })
      setProducts(res.data)
    } catch (err) {
      console.error("Failed to load products:", err)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleModeChange = async (newMode) => {
    try {
      setUpdatingMode(true)
      const updatedSettings = {
        ...settings,
        trendingSettings: { ...settings.trendingSettings, mode: newMode }
      }
      await updateSettings(updatedSettings)
      setSettings(updatedSettings)
    } catch (err) {
      console.error("Failed to update trending mode:", err)
    } finally {
      setUpdatingMode(false)
    }
  }

  const toggleTrending = async (product) => {
    try {
      await toggleTrendingAPI(product._id)
      
      const newTrendingState = !product.isTrending;

      // Update local products search list
      setProducts(products.map(p => 
        p._id === product._id ? { ...p, isTrending: newTrendingState } : p
      ))

      // Update currently trending top bar
      setCurrentlyTrending(prev => {
        if (!newTrendingState) {
          // If we are removing trending
          return prev.filter(p => p._id !== product._id)
        } else {
          // If we are adding trending (ensure no duplicates)
          if (prev.find(p => p._id === product._id)) return prev;
          return [...prev, { ...product, isTrending: true }];
        }
      })
    } catch (err) {
      console.error("Failed to toggle trending status:", err)
    }
  }

  const toggleActive = async (product) => {
    try {
      const newStatus = !product.isActive;
      await updateProductStatus(product._id, newStatus)
      
      // Update local lists
      setProducts(products.map(p => 
        p._id === product._id ? { ...p, isActive: newStatus } : p
      ))
      setCurrentlyTrending(prev => prev.map(p => 
        p._id === product._id ? { ...p, isActive: newStatus } : p
      ))
    } catch (err) {
      console.error("Failed to toggle active status:", err)
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-4">
    <Loader2 className="animate-spin text-purple-600" size={32} />
    <p>Loading Trending Management...</p>
  </div>

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Link href="/admin/settings" className="hover:text-purple-600 transition-colors">Settings</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Trending Products</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Trending Management</h1>
          <p className="text-gray-500">Curate what products appear in the "Trending" section of your homepage.</p>
        </div>
        
        <div className="bg-white border rounded-2xl p-1 shadow-sm flex">
          <button
            onClick={() => handleModeChange('automatic')}
            disabled={updatingMode}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              settings?.trendingSettings?.mode === 'automatic'
                ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
             {updatingMode && settings?.trendingSettings?.mode !== 'automatic' && <Loader2 size={14} className="animate-spin" />}
             Automatic
          </button>
          <button
            onClick={() => handleModeChange('manual')}
            disabled={updatingMode}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              settings?.trendingSettings?.mode === 'manual'
                ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
             {updatingMode && settings?.trendingSettings?.mode !== 'manual' && <Loader2 size={14} className="animate-spin" />}
             Manual Selection
          </button>
        </div>
      </div>

      {settings?.trendingSettings?.mode === 'automatic' ? (
        <div className="bg-purple-50 border border-purple-100 rounded-3xl p-8 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
            <LayoutGrid size={32} />
          </div>
          <div className="max-w-md">
            <h2 className="text-xl font-bold text-gray-900">Automatic Trending is Active</h2>
            <p className="text-gray-600 mt-2">
              System is currently showing products based on total order count. No manual selection is required. 
              The top {currentlyTrending.length} most sold products are currently featured.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 w-full mt-6">
            {currentlyTrending.map(p => (
              <div key={p._id} className="relative group aspect-square rounded-2xl overflow-hidden border bg-white shadow-sm">
                <img src={p.thumbnail || p.images?.[0]?.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                  <p className="text-[10px] text-white font-bold leading-tight">{p.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Currently Featured Bar */}
          <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Star size={18} className="text-purple-600 fill-purple-600" />
                Currently Featured ({currentlyTrending.length})
              </h2>
              {currentlyTrending.length === 0 && (
                <span className="text-xs text-red-500 font-medium bg-red-50 px-3 py-1 rounded-full">No products selected</span>
              )}
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {currentlyTrending.map(p => (
                <div key={p._id} className="w-24 shrink-0 space-y-2 group relative">
                  <div className="aspect-square rounded-2xl overflow-hidden border bg-gray-50 shadow-sm">
                    <img src={p.thumbnail || p.images?.[0]?.url} alt="" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => toggleTrending(p)}
                      className="absolute top-1 right-1 bg-white/90 backdrop-blur rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50"
                    >
                      <X size={12} />
                    </button>

                    {!p.isActive && (
                      <div className="absolute inset-x-0 bottom-0 bg-red-600/90 py-0.5 text-[8px] text-white font-bold text-center flex items-center justify-center gap-1">
                        <AlertCircle size={8} /> HIDDEN
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-gray-700 truncate text-center px-1">{p.name}</p>
                </div>
              ))}
              {currentlyTrending.length === 0 && (
                <div className="w-full h-24 flex items-center justify-center border border-dashed rounded-3xl text-gray-400 text-sm">
                  Start adding products from the list below
                </div>
              )}
            </div>
          </div>

          {/* Search & Selection Grid */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900">All Products</h2>
              <div className="relative group w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search and feature products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-purple-50 focus:border-purple-400 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {loadingProducts ? (
              <div className="flex items-center justify-center p-20">
                <Loader2 className="animate-spin text-purple-600" size={40} />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {products.map((product) => (
                  <div 
                    key={product._id} 
                    className={`group relative bg-white border rounded-3xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${
                      product.isTrending ? "border-purple-200 ring-4 ring-purple-50" : "hover:border-purple-200"
                    }`}
                  >
                    <div className="aspect-[4/5] relative bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img src={product.thumbnail || product.images?.[0]?.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      
                      {/* Selection Overlay */}
                      <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center ${
                        product.isTrending ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}>
                         <button
                            onClick={() => toggleTrending(product)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all transform active:scale-95 ${
                              product.isTrending
                                ? "bg-white text-purple-600 scale-110"
                                : "bg-purple-600 text-white hover:bg-white hover:text-purple-600"
                            }`}
                          >
                            <Star size={24} fill={product.isTrending ? "currentColor" : "none"} />
                          </button>
                      </div>
                      
                      {product.isTrending && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-1">
                          <CheckCircle2 size={10} /> FEATURED
                        </div>
                      )}

                      {!product.isActive && (
                        <div className="absolute bottom-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-1">
                          <XCircle size={10} /> INACTIVE
                        </div>
                      )}

                      <button
                        onClick={() => toggleActive(product)}
                        className={`absolute top-3 right-3 p-1.5 rounded-full shadow-sm z-20 backdrop-blur-md transition-all ${
                          product.isActive ? "bg-white/80 text-green-600 opacity-0 group-hover:opacity-100" : "bg-red-600 text-white"
                        }`}
                        title={product.isActive ? "Deactivate" : "Activate"}
                      >
                        <Power size={14} />
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{product.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-bold text-gray-400">{product.type}</span>
                        <span className="text-xs font-black text-purple-600">£{product.pricing?.basePrice}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center space-y-4 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto">
                    <Search className="text-gray-300" size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">No products found</h3>
                  <p className="text-gray-500 text-sm">Try searching for a different keyword or check your spelling.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function X({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  )
}

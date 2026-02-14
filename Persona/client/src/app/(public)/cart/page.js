"use client"

import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { getProductById } from "@/services/product.service"

const getCartKey = item => {
  // If item has an ID, use it (most reliable)
  if (item.id) {
    return item.id
  }
  
  // Otherwise, generate a key that includes design data
  const baseKey = `${item.productId}-${item.variant?.size || ""}-${item.variant?.color || ""}`
  
  // Add design hash if exists to differentiate between different designs
  if (item.designData?.cloudinary_urls) {
    // Create a hash of the cloudinary URLs to identify unique designs
    const urlsHash = Object.values(item.designData.cloudinary_urls).join('|')
    return `${baseKey}-${urlsHash.substring(0, 20)}`
  }
  
  // If no design data, use the item's index or timestamp if available
  if (item.addedAt) {
    return `${baseKey}-${item.addedAt}`
  }
  
  return baseKey
}

export default function CartClient() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [productPrices, setProductPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedDesigns, setExpandedDesigns] = useState({})

  // Fetch current prices for all products in cart
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    setItems(cart)
    
    if (cart.length > 0) {
      fetchProductPrices(cart)
    } else {
      setLoading(false)
    }
  }, [])

  // Function to fetch product prices
  const fetchProductPrices = async (cartItems) => {
    try {
      setLoading(true)
      const priceMap = {}
      
      // Get unique product IDs
      const productIds = [...new Set(cartItems.map(item => item.productId))]
      
      // Fetch prices for each product
      await Promise.all(productIds.map(async (id) => {
        try {
          const response = await getProductById(id)
          if (response?.data) {
            priceMap[id] = {
              price: response.data.pricing?.price || 0,
              specialPrice: response.data.pricing?.specialPrice || response.data.pricing?.price || 0,
              currency: 'GBP' // Force GBP currency
            }
          }
        } catch (error) {
          console.error(`Failed to fetch product ${id}:`, error)
        }
      }))
      
      setProductPrices(priceMap)
    } catch (error) {
      console.error("Error fetching product prices:", error)
    } finally {
      setLoading(false)
    }
  }

  // Function to get the current price for an item
  const getItemPrice = (item) => {
    const productPrice = productPrices[item.productId]
    const price = productPrice?.specialPrice || productPrice?.price || item.unitPrice || item.price || 0
    
    // Always use GBP with £ symbol
    return {
      amount: price,
      formatted: `£${price.toFixed(2)}`,
      currency: 'GBP'
    }
  }

  // Function to get the t-shirt preview image (with design placed on it)
  const getTshirtPreviewImage = (item) => {
    // First check if we have a generated preview image
    if (item.designData?.previewImage) {
      return item.designData.previewImage
    }
    
    // If no preview, fallback to the product image
    return item.image
  }

  // Function to get all design placements (for expanded view)
  const getDesignPlacements = (item) => {
    const placements = []
    
    if (!item.designData) return placements
    
    // Get from print_areas which contains the view configuration
    if (item.designData.print_areas) {
      Object.entries(item.designData.print_areas).forEach(([view, area]) => {
        placements.push({
          id: view,
          view: view,
          areaName: area.area?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || view,
          imageUrl: area.image?.url,
          position: area.image?.position
        })
      })
    }
    
    return placements
  }

const updateQty = (cartKey, qty) => {
  const updated = items.map(item => {
    // Compare using the unique ID
    if (item.id === cartKey || getCartKey(item) === cartKey) {
      return { ...item, quantity: qty }
    }
    return item
  })
  setItems(updated)
  localStorage.setItem("cart", JSON.stringify(updated))
}

const removeItem = cartKey => {
  const updated = items.filter(item => {
    // Filter using the unique ID
    return !(item.id === cartKey || getCartKey(item) === cartKey)
  })
  setItems(updated)
  localStorage.setItem("cart", JSON.stringify(updated))
  
  const remainingProductIds = [...new Set(updated.map(i => i.productId))]
  setProductPrices(prev => {
    const newPrices = { ...prev }
    Object.keys(newPrices).forEach(id => {
      if (!remainingProductIds.includes(id)) {
        delete newPrices[id]
      }
    })
    return newPrices
  })
}



const toggleDesignExpanded = (cartKey) => {
  setExpandedDesigns(prev => ({
    ...prev,
    [cartKey]: !prev[cartKey]
  }))
}
  const subtotal = useMemo(
    () => items.reduce((s, i) => {
      const price = productPrices[i.productId]?.specialPrice || 
                   productPrices[i.productId]?.price || 
                   i.unitPrice || 
                   i.price || 
                   0
      return s + (price * i.quantity)
    }, 0),
    [items, productPrices]
  )

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <button
          onClick={() => router.push("/products")}
          className="mt-4 bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition"
        >
          Continue Shopping
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-4">
        {items.map(item => {
          const cartKey = getCartKey(item)
          const priceInfo = getItemPrice(item)
          const itemTotal = priceInfo.amount * item.quantity
          const previewImage = getTshirtPreviewImage(item)
          const designPlacements = getDesignPlacements(item)
          const isExpanded = expandedDesigns[cartKey]

          return (
            <div
              key={cartKey}
              className="flex gap-4 border rounded-lg p-4 hover:shadow-md transition"
            >
              {/* T-Shirt Preview Image with Design on Chest */}
              <div className="relative w-24 h-24 bg-zinc-100 rounded overflow-hidden flex-shrink-0">
                {previewImage ? (
                  <Image 
                    src={previewImage} 
                    alt={`${item.name} - ${item.variant?.color} ${item.variant?.size}`}
                    fill 
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-400">No preview</span>
                  </div>
                )}

                {/* Design count badge */}
                {designPlacements.length > 0 && (
                  <div className="absolute top-1 right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {designPlacements.length}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>

                {/* VARIANT DISPLAY */}
                {item.variant && (
                  <p className="text-sm text-zinc-500">
                    Size: {item.variant.size} • Color: {item.variant.color_label || item.variant.color}
                  </p>
                )}

                {/* Custom Design Display - Shows where designs are placed on the t-shirt */}
                {item.designData && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        ✨ Custom Printed
                      </span>
                      
                      {/* Show/Hide Design Placements Button */}
                      {designPlacements.length > 0 && (
                        <button
                          onClick={() => toggleDesignExpanded(cartKey)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {isExpanded ? 'Hide details' : `View ${designPlacements.length} print area${designPlacements.length > 1 ? 's' : ''}`}
                        </button>
                      )}
                    </div>

                    {/* Design Placements Details - Shows which areas have designs */}
                    {isExpanded && designPlacements.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-700">Print Areas:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {designPlacements.map((placement) => (
                            <div key={placement.id} className="bg-gray-50 rounded p-2 border">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-medium capitalize">
                                  {placement.view}:
                                </span>
                                <span className="text-xs text-gray-600 truncate">
                                  {placement.areaName}
                                </span>
                              </div>
                              {placement.imageUrl && (
                                <div className="mt-1 flex items-center gap-1">
                                  <div className="relative w-6 h-6 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                      src={placement.imageUrl}
                                      alt={placement.areaName}
                                      fill
                                      className="object-cover"
                                      sizes="24px"
                                      unoptimized
                                    />
                                  </div>
                                  <span className="text-[10px] text-gray-500">
                                    Design placed
                                  </span>
                                </div>
                              )}
                              {placement.position && (
                                <p className="text-[10px] text-gray-400 mt-1">
                                  Size: {Math.round((placement.position.scale || 0.5) * 100)}%
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Price Display - Always £ */}
                <p className="text-sm font-medium text-black mt-2">
                  £{priceInfo.amount.toFixed(2)} each
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => updateQty(cartKey, Math.max(1, item.quantity - 1))}
                      className="px-2 py-1 hover:bg-gray-100 text-gray-600"
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => {
                        const val = parseInt(e.target.value)
                        if (!isNaN(val) && val > 0) {
                          updateQty(cartKey, val)
                        }
                      }}
                      className="w-12 text-center border-x px-1 py-1 focus:outline-none"
                    />
                    <button
                      onClick={() => updateQty(cartKey, item.quantity + 1)}
                      className="px-2 py-1 hover:bg-gray-100 text-gray-600"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(cartKey)}
                    className="text-sm text-red-600 hover:text-red-800 ml-2"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-lg">
                  £{itemTotal.toFixed(2)}
                </p>
                {productPrices[item.productId]?.specialPrice && (
                  <p className="text-xs text-green-600">
                    Special price applied
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="border rounded-xl p-6 h-fit space-y-4 sticky top-6">
        <h2 className="text-lg font-semibold">Order Summary</h2>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
            <span className="font-medium">
              £{subtotal.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span>Calculated at checkout</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>
              £{subtotal.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Inclusive of all taxes
          </p>
        </div>

        <button
          onClick={() => router.push("/checkout")}
          className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition active:scale-[0.98]"
        >
          Proceed to Checkout
        </button>

        <button
          onClick={() => router.push("/products")}
          className="w-full border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  )
}
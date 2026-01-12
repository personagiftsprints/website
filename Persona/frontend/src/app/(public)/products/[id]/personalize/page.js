"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { getProductById } from "@/services/product.service"
import Skeleton from "@/components/ui/Skeleton"
import { 
  Upload, 
  Type, 
  Palette, 
  ArrowLeft,
  Sparkles,
  Check,
  Image as ImageIcon
} from "lucide-react"

export default function PersonalizeProductPage() {
  const { id } = useParams()
  const router = useRouter()
  const fileInputRefs = useRef({})

  const [product, setProduct] = useState(null)
  const [personalization, setPersonalization] = useState({})
  const [previewImage, setPreviewImage] = useState(null)
  const [activeTab, setActiveTab] = useState("text")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id)
        if (data.productType !== "personalized") {
          router.push(`/products/${id}`)
          return
        }
        setProduct(data)
        setPreviewImage(data.images?.[0])
        
        // Initialize personalization with default values
        const initialPersonalization = {}
        data.personalizationConfig?.areas?.forEach(area => {
          if (area.defaultValue) {
            initialPersonalization[area.areaId] = area.defaultValue
          }
        })
        setPersonalization(initialPersonalization)
      } catch (e) {
        console.error("Failed to fetch product:", e.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchProduct()
  }, [id, router])

  const updateArea = (areaId, value) => {
    setPersonalization(prev => ({
      ...prev,
      [areaId]: value
    }))
  }

  const handleImageUpload = (areaId, event) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateArea(areaId, {
          type: "image",
          value: reader.result,
          fileName: file.name
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const addToCart = () => {
    const payload = {
      productId: product._id,
      personalization,
      price: product.basePrice,
      productType: product.itemType,
      productName: product.name
    }

    console.log("ADD TO CART PAYLOAD:", payload)
    // TODO: Implement add to cart functionality
    alert("Added to cart!")
  }

  const quickCheckout = () => {
    const payload = {
      productId: product._id,
      personalization,
      price: product.basePrice
    }
    
    console.log("QUICK CHECKOUT PAYLOAD:", payload)
    router.push(`/checkout?product=${product._id}`)
  }

  const getProductLayout = () => {
    if (!product) return "default"
    
    const type = product.itemType?.toLowerCase()
    if (type.includes("t-shirt") || type.includes("shirt")) return "tshirt"
    if (type.includes("mug") || type.includes("cup")) return "mug"
    if (type.includes("poster") || type.includes("print")) return "poster"
    if (type.includes("phone") || type.includes("case")) return "phonecase"
    return "default"
  }

  const renderProductPreview = () => {
    const layout = getProductLayout()
    
    return (
      <div className={`relative ${layout === 'tshirt' ? 'h-125' : 'h-112.5'} w-full`}>
        {previewImage ? (
          <Image
            src={previewImage}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Personalization overlay */}
        {Object.entries(personalization).map(([areaId, data]) => {
          const area = product.personalizationConfig.areas.find(a => a.areaId === areaId)
          if (!area || !data.value) return null
          
          return (
            <div
              key={areaId}
              className={`absolute ${getAreaPosition(area.position, layout)}`}
              style={getAreaStyles(area, layout)}
            >
              {data.type === "text" && (
                <div 
                  className="text-center font-medium"
                  style={{ 
                    fontSize: area.fontSize || '16px',
                    color: area.color || '#000000',
                    fontFamily: area.fontFamily || 'inherit'
                  }}
                >
                  {data.value}
                </div>
              )}
              {data.type === "image" && (
                <div className="relative w-full h-full">
                  <img
                    src={data.value}
                    alt="Personalized image"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const getAreaPosition = (position, layout) => {
    const positions = {
      tshirt: {
        center: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
        chest: "top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
        back: "top-2/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      },
      mug: {
        front: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
        wrap: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4"
      },
      default: {
        center: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      }
    }
    
    return positions[layout]?.[position] || positions.default.center
  }

  const getAreaStyles = (area, layout) => {
    const baseStyles = {
      maxWidth: area.maxWidth || '200px',
      maxHeight: area.maxHeight || '100px'
    }
    
    const layoutStyles = {
      tshirt: {
        width: area.width || '200px',
        height: area.height || 'auto'
      },
      mug: {
        width: area.width || '150px',
        height: area.height || '80px'
      },
      poster: {
        width: area.width || '300px',
        height: area.height || 'auto'
      }
    }
    
    return { ...baseStyles, ...layoutStyles[layout] }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-6 w-1/4 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[500px] w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <button
          onClick={() => router.push('/collections')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Browse Collections
        </button>
      </div>
    )
  }

  const layout = getProductLayout()

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      <div className="max-w-8xl mx-auto px-4 py-2">
        {/* Header */}
        <div className="mb-8">
         
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Personalize Your {product.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Design your unique {product.itemType} with custom text and images
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Preview Section */}
          <div className="space-y-6">
            <div className="bg-white  p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Live Preview</h2>
             
              </div>
              
              <div className="relative  p-4">
                {renderProductPreview()}
              </div>
              
              {/* Preview Controls */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>Drag and resize elements in the preview</span>
                <button 
                  onClick={() => setPreviewImage(product.images?.[0])}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  Reset Preview
                </button>
              </div>
            </div>

            {/* Design Tips */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Design Tips
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use high-resolution images for best print quality</li>
                <li>• Keep text within safe area to avoid cropping</li>
                <li>• Consider color contrast for better readability</li>
                {layout === 'tshirt' && <li>• Avoid placing designs too close to seams</li>}
                {layout === 'mug' && <li>• Wrap designs work best with patterns or repeating text</li>}
              </ul>
            </div>
          </div>

          {/* Personalization Form */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setActiveTab("text")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    activeTab === "text" 
                      ? "bg-indigo-100 text-indigo-700" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Type className="w-4 h-4" />
                  Text
                </button>
                <button
                  onClick={() => setActiveTab("images")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    activeTab === "images" 
                      ? "bg-indigo-100 text-indigo-700" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  Images
                </button>
                <button
                  onClick={() => setActiveTab("design")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    activeTab === "design" 
                      ? "bg-indigo-100 text-indigo-700" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  Design
                </button>
              </div>

              {product.personalizationConfig?.areas?.map((area) => (
                <div key={area.areaId} className="mb-6 last:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-semibold text-gray-900">
                      {area.label}
                    </label>
                    <span className="text-sm text-gray-500">
                      Position: {area.position}
                    </span>
                  </div>

                  {/* Text Input */}
                  {area.allowedTypes.includes("text") && (
                    <div className="space-y-3">
                      <textarea
                        placeholder={`Enter ${area.label.toLowerCase()}...`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows={3}
                        onChange={(e) => updateArea(area.areaId, {
                          type: "text",
                          value: e.target.value
                        })}
                        defaultValue={personalization[area.areaId]?.value || ""}
                      />
                      <div className="flex items-center gap-4 text-sm">
                        <select className="px-3 py-1 border rounded">
                          <option>Select Font</option>
                          <option>Arial</option>
                          <option>Helvetica</option>
                          <option>Times New Roman</option>
                        </select>
                        <input type="color" className="w-8 h-8 cursor-pointer" />
                      </div>
                    </div>
                  )}

                  {/* Image Upload */}
                  {area.allowedTypes.includes("image") && (
                    <div className="space-y-3">
                      <div
                        onClick={() => fileInputRefs.current[area.areaId]?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                      >
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="font-medium text-gray-700">Click to upload image</p>
                        <p className="text-sm text-gray-500 mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                      <input
                        ref={el => fileInputRefs.current[area.areaId] = el}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(area.areaId, e)}
                      />
                      
                      {personalization[area.areaId]?.type === "image" && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center gap-3">
                          <ImageIcon className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-700">
                            {personalization[area.areaId].fileName} uploaded
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
          
          </div>
        </div>
      </div>
    </div>
  )
}
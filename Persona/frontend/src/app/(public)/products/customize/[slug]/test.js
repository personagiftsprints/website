"use client"

import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getProductBySlug } from '@/services/product.service'
import { getPrintConfigBySlug } from '@/services/printArea.service'
import { addToCart } from '@/lib/cart'
import { uploadImagesToCloudinary } from '@/services/upload.service'
import { Menu, X, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'

const FONTS = [
  { label: 'Sans', value: 'font-sans' },
  { label: 'Serif', value: 'font-serif' },
  { label: 'Mono', value: 'font-mono' },
  { label: 'Display', value: 'font-bold' }
]

// Simple icon components as fallback
const SmartphoneIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

const ShirtIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
)

const MugIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
  </svg>
)

const InfoIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default function CustomizeProductPage() {
  const { slug } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef(null)

  // Safely parse variant from URL query
 const lockedAttributes = useMemo(() => {
  const variantParam = searchParams.get('variant')
  if (!variantParam) return {}

  try {
    return JSON.parse(variantParam)
  } catch {
    return {}
  }
}, [searchParams])


  const [product, setProduct] = useState(null)
  const [config, setConfig] = useState(null)

  const [selectedView, setSelectedView] = useState(null)
  const [selectedArea, setSelectedArea] = useState(null)
  const [selectedModel, setSelectedModel] = useState(null) // For mobile case

  const [designType, setDesignType] = useState('image')
  const [designs, setDesigns] = useState({})

  const [textValue, setTextValue] = useState('')
  const [fontFamily, setFontFamily] = useState(FONTS[0].value)

  const [selectedAttributes, setSelectedAttributes] = useState({})
  const [selectedVariant, setSelectedVariant] = useState(null)

  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Mobile drawer & preview states
  const [mobileLeftDrawerOpen, setMobileLeftDrawerOpen] = useState(false)
  const [mobileRightDrawerOpen, setMobileRightDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobilePreview, setShowMobilePreview] = useState(false)

  // ────────────────────────────────────────────────
  // CONFIG TYPE DETECTION
  // ────────────────────────────────────────────────
  const isMobileCaseConfig = config?.type === 'mobileCase'
  const isTshirtConfig = config?.type === 'tshirt'
  const isMugConfig = config?.type === 'mug'
useEffect(() => {
  console.log("Print config:", isMugConfig)
}, [isMugConfig])

  
  // Generic view detection - works for all config types
  const configType = config?.type || 'generic'
  const hasVariants = !!product?.productConfig?.variants?.length

  // Get views based on config type
  const getAvailableViews = () => {
    if (!config) return {}
    
    if (isMobileCaseConfig && config.models) {
      // Mobile case: views come from selected model
      if (selectedModel && config.models.length > 0) {
        const model = config.models.find(m => m.modelCode === selectedModel)
        return model && model.view ? { [model.modelCode]: model.view } : {}
      }
      // If no model selected, show first model's view
      if (config.models.length > 0) {
        const firstModel = config.models[0]
        return { [firstModel.modelCode]: firstModel.view }
      }
      return {}
    }
    
    // T-shirt, mug, or generic config: views are directly in config
    return config.views || {}
  }

  // Get current view data
  const getCurrentViewData = () => {
    const views = getAvailableViews()
    return views[selectedView] || null
  }

  // Get all available views for selection (used in UI)
  const getAllViewOptions = () => {
    if (!config) return []
    
    if (isMobileCaseConfig && config.models) {
      // For mobile case, views are tied to models
      return config.models.map(model => ({
        id: model.modelCode,
        name: model.modelName,
        type: 'model'
      }))
    }
    
    // For other configs, use the view keys
    return Object.keys(config.views || {}).map(viewKey => ({
      id: viewKey,
      name: viewKey.replace('_', ' '),
      type: 'view'
    }))
  }

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load product + print config
  useEffect(() => {
    if (!slug) return

    const load = async () => {
      try {
        setLoading(true)
        const productRes = await getProductBySlug(slug)
       
        if (!productRes?.success) {
          router.push('/404')
          return
        }

        const data = productRes.data
        if (!data.customization?.enabled) {
          setError('Customization not available')
          setLoading(false)
          return
        }

        setProduct(data)

        const cfg = await getPrintConfigBySlug(data.customization.printConfig.configType)
        setConfig(cfg)

        // Initialize based on config type
        if (cfg.type === 'mobileCase' && cfg.models?.length > 0) {
          // Mobile case: select first model
          const firstModel = cfg.models[0]
          setSelectedModel(firstModel.modelCode)
          setSelectedView(firstModel.modelCode)
          if (firstModel.view?.areas?.length > 0) {
            setSelectedArea(firstModel.view.areas[0])
          }
        } else if (cfg.views && Object.keys(cfg.views).length > 0) {
          // T-shirt, mug, or generic: select first view
          const firstView = Object.keys(cfg.views)[0]
          setSelectedView(firstView)
          const firstViewData = cfg.views[firstView]
          if (firstViewData?.areas?.length > 0) {
            setSelectedArea(firstViewData.areas[0])
          }
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug, router])

  // Lock variant from URL (only variant products)
  useEffect(() => {
    if (!hasVariants || Object.keys(lockedAttributes).length === 0) return
    setSelectedAttributes(lockedAttributes)
  }, [lockedAttributes, hasVariants])

  // Match selected variant (only variant products)
  useEffect(() => {
    if (!hasVariants || !product?.productConfig?.variants) return

    const match = product.productConfig.variants.find(v =>
      Object.entries(selectedAttributes).every(([k, val]) => v.attributes[k] === val)
    )

    setSelectedVariant(match || null)
    if (match) setQuantity(1)
  }, [selectedAttributes, product, hasVariants])

  const isOptionDisabled = (code, value) => {
    if (!hasVariants) return false
    return !product.productConfig.variants.some(v =>
      v.attributes[code] === value &&
      Object.entries(selectedAttributes).every(([k, v2]) => k === code || v.attributes[k] === v2) &&
      v.stockQuantity > 0
    )
  }

  // Handle model change for mobile case
  const handleModelChange = (modelCode) => {
    setSelectedModel(modelCode)
    setSelectedView(modelCode)
    
    const model = config.models.find(m => m.modelCode === modelCode)
    if (model && model.view?.areas?.length > 0) {
      setSelectedArea(model.view.areas[0])
    }
    
    // Clear designs when changing model
    setDesigns({})
  }

  // Handle view change for non-mobile case configs
  const handleViewChange = (viewId) => {
    setSelectedView(viewId)
    
    const viewData = config.views[viewId]
    if (viewData?.areas?.length > 0) {
      setSelectedArea(viewData.areas[0])
    }
  }

  const handleAreaChange = area => {
    // For t-shirts, confirm if changing print position with existing design
    if (isTshirtConfig) {
      const existing = designs[selectedView]?.[selectedArea?.id]
      if (existing && area.id !== selectedArea.id) {
        if (!window.confirm('Change print position and discard current design?')) return
      }
    }
    setSelectedArea(area)
  }

  const handleImageUpload = e => {
    const file = e.target.files[0]
    if (!file || !selectedArea) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5MB')
      return
    }

    const imageUrl = URL.createObjectURL(file)

    setDesigns(prev => ({
      ...prev,
      [selectedView]: {
        ...prev[selectedView] || {},
        [selectedArea.id]: {
          type: 'image',
          file,
          imageUrl,
          name: file.name
        }
      }
    }))

    if (isMobile) setShowMobilePreview(true)
  }

  // Text design effect
  useEffect(() => {
    if (designType !== 'text' || !selectedArea || !selectedView) return

    if (textValue.trim() || designs[selectedView]?.[selectedArea.id]?.type === 'text') {
      setDesigns(prev => ({
        ...prev,
        [selectedView]: {
          ...prev[selectedView] || {},
          [selectedArea.id]: {
            type: 'text',
            text: textValue,
            font: fontFamily
          }
        }
      }))

      if (isMobile && textValue.trim()) setShowMobilePreview(true)
    }
  }, [textValue, fontFamily, designType, selectedArea, selectedView, isMobile])

  const uploadDesignImages = async designsObj => {
    const files = []
    const indexMap = []

    Object.entries(designsObj || {}).forEach(([viewKey, viewData]) => {
      Object.entries(viewData).forEach(([areaId, design]) => {
        if (design?.type === 'image' && design.file) {
          files.push(design.file)
          indexMap.push({ viewKey, areaId })
        }
      })
    })

    if (!files.length) return designsObj

    const uploaded = await uploadImagesToCloudinary(files)
    const updated = structuredClone(designsObj || {})

    uploaded.forEach((img, i) => {
      const { viewKey, areaId } = indexMap[i]
      updated[viewKey][areaId] = {
        type: 'image',
        imageUrl: img.url,
        publicId: img.publicId,
        uploaded: true
      }
    })

    return updated
  }

  const buildCartItem = async () => {
    if (!product) return null
    if (hasVariants && !selectedVariant) return null

    let finalDesigns = designs
    if (product.customization?.enabled) {
      finalDesigns = await uploadDesignImages(designs)
    }

    return {
      productId: product._id,
      slug: product.slug,
      name: product.name,
      type: product.type,
      image: product.thumbnail,
      price: product.pricing.specialPrice ?? product.pricing.basePrice,
      quantity,
      variant: hasVariants ? (selectedVariant?.attributes || null) : null,
      model: isMobileCaseConfig ? selectedModel : null, // Add model for mobile case
      customization: product.customization?.enabled
        ? {
            enabled: true,
            printConfigType: product.customization.printConfig.configType,
            design: finalDesigns
          }
        : { enabled: false }
    }
  }

  const handleAddToCart = async () => {
    const item = await buildCartItem()
    if (!item) {
      alert(hasVariants ? 'Please select a variant first' : 'Cannot add – missing configuration')
      return
    }
    
    // Additional validation for mobile case
    if (isMobileCaseConfig && !selectedModel) {
      alert('Please select a phone model first')
      return
    }
    
    addToCart(item)
    alert('Added to cart!')
  }

  const handleBuyNow = async () => {
    const item = await buildCartItem()
    if (!item) {
      alert(hasVariants ? 'Please select a variant first' : 'Cannot proceed – missing configuration')
      return
    }
    
    // Additional validation for mobile case
    if (isMobileCaseConfig && !selectedModel) {
      alert('Please select a phone model first')
      return
    }
    
    addToCart(item)
    router.push('/checkout')
  }

  // Get icon for product type
  const getProductIcon = () => {
    if (isMobileCaseConfig) return <SmartphoneIcon />
    if (isTshirtConfig) return <ShirtIcon />
    if (isMugConfig) return <MugIcon />
    return <InfoIcon />
  }

  if (loading) return <div className="fixed inset-0 flex items-center justify-center">Loading…</div>
  if (error) return <div className="fixed inset-0 flex items-center justify-center text-red-500">{error}</div>
  if (!product || !config) return <div className="fixed inset-0 flex items-center justify-center">Product not found</div>

  const views = getAvailableViews()
  const viewData = getCurrentViewData()
  const currentDesign = designs[selectedView]?.[selectedArea?.id]
  const viewOptions = getAllViewOptions()

  if (!viewData) return <div className="fixed inset-0 flex items-center justify-center">No view data available</div>

  // ────────────────────────────────────────────────
  // DESKTOP LAYOUT
  // ────────────────────────────────────────────────
  const DesktopLayout = () => (
    <div className="flex h-screen bg-white">
      {/* LEFT - Product + Variants/Model Selection */}
      <div className="w-80 border-r p-5 space-y-6 overflow-y-auto">
        <img src={product.thumbnail} alt={product.name} className="w-full rounded" />
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{product.name}</h2>
          {getProductIcon()}
        </div>

        {/* Variant selection for variant-based products */}
        {hasVariants && product.productConfig?.attributes?.map(attr => (
          <div key={attr.code}>
            <p className="text-sm mb-2">{attr.name}</p>
            <div className="flex gap-2 flex-wrap">
              {attr.values?.map(value => (
                <button
                  key={value}
                  disabled={isOptionDisabled(attr.code, value)}
                  onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.code]: value }))}
                  className={`px-3 py-2 border rounded transition-colors ${
                    selectedAttributes[attr.code] === value ? 'bg-black text-white' : 'hover:bg-gray-100'
                  } ${isOptionDisabled(attr.code, value) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Model selection for mobile case */}
        {isMobileCaseConfig && config.models && (
          <div>
            <p className="text-sm mb-2 font-medium">Select Phone Model</p>
            <div className="space-y-2">
              {config.models.map(model => (
                <button
                  key={model.modelCode}
                  onClick={() => handleModelChange(model.modelCode)}
                  className={`w-full p-3 border rounded text-left transition-colors ${
                    selectedModel === model.modelCode ? 'bg-black text-white border-black' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{model.modelName}</span>
                    <span className="text-xs text-gray-500">{model.year}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {model.displaySize} • {model.dimensions.height} × {model.dimensions.width}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CENTER - Canvas */}
      <div className="flex-1 flex items-center justify-center bg-gray-100 relative">
        {viewData.baseImage ? (
          <img
            src={viewData.baseImage}
            alt={isMobileCaseConfig ? `${selectedModel} view` : `${product.name} - ${selectedView}`}
            className="max-h-full object-contain"
          />
        ) : (
          <div className="text-gray-400">No preview available</div>
        )}
        
        {currentDesign?.type === 'image' && currentDesign.imageUrl && (
          <img
            src={currentDesign.imageUrl}
            alt="Custom design"
            className="absolute max-h-[60%] max-w-[60%] object-contain"
            style={{ 
              left: selectedArea?.position?.x || '50%', 
              top: selectedArea?.position?.y || '50%', 
              transform: 'translate(-50%, -50%)' 
            }}
          />
        )}
        
        {currentDesign?.type === 'text' && currentDesign.text && (
          <div
            className={`absolute text-3xl ${currentDesign.font}`}
            style={{ 
              left: selectedArea?.position?.x || '50%', 
              top: selectedArea?.position?.y || '50%', 
              transform: 'translate(-50%, -50%)', 
              whiteSpace: 'nowrap' 
            }}
          >
            {currentDesign.text}
          </div>
        )}
      </div>

      {/* RIGHT - Customization + Actions */}
      <div className="w-96 border-l p-6 space-y-6 overflow-y-auto">
        {/* View/Model selection */}
        {isMobileCaseConfig ? (
          <div>
            <h3 className="font-semibold mb-2">Selected Model</h3>
            {selectedModel && config.models && (
              <div className="p-3 bg-gray-50 rounded mb-4">
                <p className="font-medium">{config.models.find(m => m.modelCode === selectedModel)?.modelName}</p>
                <p className="text-sm text-gray-600">Current view</p>
              </div>
            )}
          </div>
        ) : viewOptions.length > 0 ? (
          <div>
            <h3 className="font-semibold mb-2">View</h3>
            <div className="flex gap-2 flex-wrap">
              {viewOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleViewChange(option.id)}
                  className={`px-3 py-1 rounded transition-colors ${
                    selectedView === option.id ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Print Area */}
        {viewData.areas && viewData.areas.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Print Area</h3>
            {viewData.areas.map(area => (
              <div
                key={area.id}
                onClick={() => handleAreaChange(area)}
                className={`p-3 border rounded mb-2 cursor-pointer transition-colors ${
                  selectedArea?.id === area.id ? 'border-black bg-black text-white' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{area.name}</span>
                  {area.max && <span className="text-xs text-gray-500">{area.max}</span>}
                </div>
                {area.description && (
                  <p className="text-xs text-gray-500 mt-1">{area.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Design Type */}
        <div>
          <h3 className="font-semibold mb-2">Design Type</h3>
          <div className="flex gap-2">
            {['image', 'text'].map(t => (
              <button
                key={t}
                onClick={() => setDesignType(t)}
                className={`px-3 py-1 rounded transition-colors ${
                  designType === t ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Text Design Input */}
        {designType === 'text' && (
          <>
            <input
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              placeholder="Enter your text here"
              className="w-full border p-2 rounded"
            />
            <div className="flex gap-2 flex-wrap">
              {FONTS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFontFamily(f.value)}
                  className={`px-3 py-1 rounded transition-colors ${fontFamily === f.value ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'} ${f.value}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Image Upload */}
        {designType === 'image' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-dashed border-2 border-gray-300 p-6 text-center cursor-pointer hover:border-gray-400 transition-colors rounded"
          >
            <p className="text-gray-600">Click to upload image</p>
            <p className="text-sm text-gray-500 mt-1">Max 5MB • JPG, PNG, GIF</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleImageUpload}
              accept="image/*"
            />
          </div>
        )}

        {/* Current Design Preview */}
        {currentDesign && (
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium">Current Design:</p>
            <p className="text-sm text-gray-600">
              {currentDesign.type === 'image'
                ? `Image: ${currentDesign.name || 'Uploaded image'}`
                : `Text: "${currentDesign.text}"`}
            </p>
          </div>
        )}

        {/* Quantity Controls */}
        <div className="flex gap-3 items-center justify-center">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-10 h-10 border rounded flex items-center justify-center"
            disabled={quantity <= 1}
          >−</button>
          <input
            type="number"
            value={quantity}
            min={1}
            max={hasVariants && selectedVariant ? selectedVariant.stockQuantity : undefined}
            onChange={e => {
              const newVal = Number(e.target.value)
              if (hasVariants && selectedVariant) {
                setQuantity(Math.max(1, Math.min(selectedVariant.stockQuantity, newVal)))
              } else {
                setQuantity(Math.max(1, newVal))
              }
            }}
            className="w-20 text-center border rounded py-2"
          />
          <button
            onClick={() => {
              if (hasVariants && selectedVariant) {
                setQuantity(q => Math.min(selectedVariant.stockQuantity, q + 1))
              } else {
                setQuantity(q => q + 1)
              }
            }}
            className="w-10 h-10 border rounded flex items-center justify-center"
            disabled={hasVariants && selectedVariant && quantity >= selectedVariant.stockQuantity}
          >+</button>
        </div>

        {/* Stock Info for Variant Products */}
        {hasVariants && selectedVariant && (
          <p className={`text-center font-medium ${
            selectedVariant.stockQuantity > 10 ? 'text-green-600' :
            selectedVariant.stockQuantity > 0 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {selectedVariant.stockQuantity > 0
              ? `${selectedVariant.stockQuantity} in stock`
              : 'Out of stock'}
          </p>
        )}

        {/* Action Buttons */}
        <button
          onClick={handleAddToCart}
          disabled={(hasVariants && (!selectedVariant || selectedVariant.stockQuantity === 0)) ||
                   (isMobileCaseConfig && !selectedModel)}
          className={`w-full py-3 rounded transition-colors font-medium ${
            (hasVariants && (!selectedVariant || selectedVariant.stockQuantity === 0)) ||
            (isMobileCaseConfig && !selectedModel)
              ? 'bg-gray-300 cursor-not-allowed text-gray-700'
              : 'bg-gray-900 hover:bg-black text-white'
          }`}
        >
          {isMobileCaseConfig && !selectedModel ? 'Select Model First' :
           hasVariants
            ? (!selectedVariant ? 'Select Variant' : selectedVariant.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart')
            : 'Add to Cart'}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={(hasVariants && (!selectedVariant || selectedVariant.stockQuantity === 0)) ||
                   (isMobileCaseConfig && !selectedModel)}
          className={`w-full py-3 rounded transition-colors font-medium ${
            (hasVariants && (!selectedVariant || selectedVariant.stockQuantity === 0)) ||
            (isMobileCaseConfig && !selectedModel)
              ? 'bg-gray-300 cursor-not-allowed text-gray-700'
              : 'bg-black hover:bg-gray-800 text-white'
          }`}
        >
          Buy Now
        </button>
      </div>
    </div>
  )

  // ────────────────────────────────────────────────
  // MOBILE LAYOUT
  // ────────────────────────────────────────────────
  const MobileLayout = () => (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={() => setMobileLeftDrawerOpen(true)} className="p-2">
          <Menu size={24} />
        </button>
        <h2 className="text-lg font-semibold truncate max-w-[50vw]">{product.name}</h2>
        <button onClick={() => setMobileRightDrawerOpen(true)} className="p-2">
          <ShoppingCart size={24} />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center bg-gray-100 relative overflow-hidden">
        {viewData.baseImage ? (
          <img
            src={viewData.baseImage}
            alt={isMobileCaseConfig ? `${selectedModel} view` : `${product.name} - ${selectedView}`}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="text-gray-400 text-center p-4">
            <p>No preview available</p>
            <p className="text-sm">Select a {isMobileCaseConfig ? 'model' : 'view'} to see preview</p>
          </div>
        )}
        
        {currentDesign?.type === 'image' && currentDesign.imageUrl && (
          <img
            src={currentDesign.imageUrl}
            alt="Custom design"
            className="absolute max-h-[60%] max-w-[60%] object-contain"
            style={{ 
              left: selectedArea?.position?.x || '50%', 
              top: selectedArea?.position?.y || '50%', 
              transform: 'translate(-50%, -50%)' 
            }}
          />
        )}
        
        {currentDesign?.type === 'text' && currentDesign.text && (
          <div
            className={`absolute text-2xl ${currentDesign.font}`}
            style={{ 
              left: selectedArea?.position?.x || '50%', 
              top: selectedArea?.position?.y || '50%', 
              transform: 'translate(-50%, -50%)', 
              whiteSpace: 'nowrap' 
            }}
          >
            {currentDesign.text}
          </div>
        )}

        {/* Floating preview after upload */}
        {showMobilePreview && currentDesign && (
          <div
            className="absolute bottom-16 left-4 right-4 z-30 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-3 border border-gray-200 flex items-center gap-3 cursor-pointer"
            onClick={() => setMobileRightDrawerOpen(true)}
          >
            <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border">
              {currentDesign.type === 'image' && currentDesign.imageUrl ? (
                <img src={currentDesign.imageUrl} alt="preview" className="w-full h-full object-cover" />
              ) : currentDesign.type === 'text' && currentDesign.text ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xs font-medium text-center p-1 overflow-hidden">
                  {currentDesign.text.slice(0, 20)}{currentDesign.text.length > 20 ? '...' : ''}
                </div>
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {currentDesign.type === 'image' ? (currentDesign.name || 'Uploaded image') : `Text: ${currentDesign.text || ''}`}
              </p>
              <p className="text-xs text-gray-500">Tap to edit / change</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setShowMobilePreview(false) }}
              className="p-1 text-gray-500 hover:text-gray-800"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Quick drawer buttons */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
          <button onClick={() => setMobileLeftDrawerOpen(true)} className="bg-white p-3 rounded-full shadow-lg border">
            <ChevronLeft size={24} />
          </button>
          <button onClick={() => setMobileRightDrawerOpen(true)} className="bg-white p-3 rounded-full shadow-lg border">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* LEFT DRAWER - Product info + Variants/Model selection */}
      {mobileLeftDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMobileLeftDrawerOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-80 bg-white z-50 overflow-y-auto shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Product Details</h3>
              <button onClick={() => setMobileLeftDrawerOpen(false)}><X size={24} /></button>
            </div>
            <div className="p-4 space-y-6">
              <img src={product.thumbnail} alt={product.name} className="w-full rounded" />
              
              {/* Variant selection */}
              {hasVariants && product.productConfig?.attributes?.map(attr => (
                <div key={attr.code}>
                  <p className="text-sm mb-2 font-medium">{attr.name}</p>
                  <div className="flex gap-2 flex-wrap">
                    {attr.values?.map(value => (
                      <button
                        key={value}
                        disabled={isOptionDisabled(attr.code, value)}
                        onClick={() => {
                          setSelectedAttributes(prev => ({ ...prev, [attr.code]: value }))
                          setMobileLeftDrawerOpen(false)
                        }}
                        className={`px-3 py-2 border rounded transition-colors text-sm ${
                          selectedAttributes[attr.code] === value ? 'bg-black text-white' : 'hover:bg-gray-100'
                        } ${isOptionDisabled(attr.code, value) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Model selection for mobile case */}
              {isMobileCaseConfig && config.models && (
                <div>
                  <p className="text-sm mb-2 font-medium">Select Phone Model</p>
                  <div className="space-y-2">
                    {config.models.map(model => (
                      <button
                        key={model.modelCode}
                        onClick={() => {
                          handleModelChange(model.modelCode)
                          setMobileLeftDrawerOpen(false)
                        }}
                        className={`w-full p-3 border rounded text-left transition-colors ${
                          selectedModel === model.modelCode ? 'bg-black text-white border-black' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{model.modelName}</span>
                          <span className="text-xs text-gray-500">{model.year}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {model.displaySize}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* RIGHT DRAWER - Customization */}
      {mobileRightDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMobileRightDrawerOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white z-50 overflow-y-auto shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Customize</h3>
              <button onClick={() => setMobileRightDrawerOpen(false)}><X size={24} /></button>
            </div>
            <div className="p-4 space-y-6">
              {/* View/Model info */}
              {isMobileCaseConfig && selectedModel ? (
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">{config.models.find(m => m.modelCode === selectedModel)?.modelName}</p>
                  <p className="text-sm text-gray-600">Selected model</p>
                </div>
              ) : viewOptions.length > 0 ? (
                <div>
                  <h3 className="font-semibold mb-2">View</h3>
                  <div className="flex gap-2 flex-wrap">
                    {viewOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => handleViewChange(option.id)}
                        className={`px-3 py-1 rounded transition-colors text-sm ${
                          selectedView === option.id ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Print Area */}
              {viewData.areas && viewData.areas.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Print Area</h3>
                  {viewData.areas.map(area => (
                    <div
                      key={area.id}
                      onClick={() => handleAreaChange(area)}
                      className={`p-3 border rounded mb-2 cursor-pointer transition-colors text-sm ${
                        selectedArea?.id === area.id ? 'border-black bg-black text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{area.name}</span>
                        {area.max && <span className="text-xs text-gray-500">{area.max}</span>}
                      </div>
                      {area.description && (
                        <p className="text-xs text-gray-500 mt-1">{area.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Design Type */}
              <div>
                <h3 className="font-semibold mb-2">Design Type</h3>
                <div className="flex gap-2">
                  {['image', 'text'].map(t => (
                    <button
                      key={t}
                      onClick={() => setDesignType(t)}
                      className={`px-3 py-2 rounded transition-colors flex-1 text-sm ${
                        designType === t ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Design */}
              {designType === 'text' && (
                <div className="space-y-4">
                  <input
                    value={textValue}
                    onChange={e => setTextValue(e.target.value)}
                    placeholder="Enter your text here"
                    className="w-full border p-3 rounded text-sm"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {FONTS.map(f => (
                      <button
                        key={f.value}
                        onClick={() => setFontFamily(f.value)}
                        className={`px-3 py-2 rounded transition-colors flex-1 min-w-[80px] text-sm ${
                          fontFamily === f.value ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
                        } ${f.value}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Upload */}
              {designType === 'image' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-dashed border-2 border-gray-300 p-6 text-center cursor-pointer hover:border-gray-400 transition-colors rounded"
                >
                  <p className="text-gray-600">Upload Image</p>
                  <p className="text-sm text-gray-500 mt-1">Max 5MB • JPG, PNG, GIF</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                </div>
              )}

              {/* Current Design */}
              {currentDesign && (
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium">Current Design:</p>
                  <p className="text-sm text-gray-600 truncate">
                    {currentDesign.type === 'image'
                      ? `Image: ${currentDesign.name || 'Uploaded image'}`
                      : `Text: "${currentDesign.text}"`}
                  </p>
                </div>
              )}

              {/* Quantity Controls */}
              <div className="flex gap-3 items-center justify-center">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 border rounded flex items-center justify-center text-lg"
                  disabled={quantity <= 1}
                >−</button>
                <input
                  type="number"
                  value={quantity}
                  min={1}
                  max={hasVariants && selectedVariant ? selectedVariant.stockQuantity : undefined}
                  onChange={e => {
                    const newVal = Number(e.target.value)
                    if (hasVariants && selectedVariant) {
                      setQuantity(Math.max(1, Math.min(selectedVariant.stockQuantity, newVal)))
                    } else {
                      setQuantity(Math.max(1, newVal))
                    }
                  }}
                  className="w-20 text-center border rounded py-2 text-lg"
                />
                <button
                  onClick={() => {
                    if (hasVariants && selectedVariant) {
                      setQuantity(q => Math.min(selectedVariant.stockQuantity, q + 1))
                    } else {
                      setQuantity(q => q + 1)
                    }
                  }}
                  className="w-10 h-10 border rounded flex items-center justify-center text-lg"
                  disabled={hasVariants && selectedVariant && quantity >= selectedVariant.stockQuantity}
                >+</button>
              </div>

              {/* Stock Info */}
              {hasVariants && selectedVariant && (
                <p className={`text-center font-medium ${
                  selectedVariant.stockQuantity > 10 ? 'text-green-600' :
                  selectedVariant.stockQuantity > 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {selectedVariant.stockQuantity > 0
                    ? `${selectedVariant.stockQuantity} in stock`
                    : 'Out of stock'}
                </p>
              )}

              {/* Action Buttons */}
              <button
                onClick={handleAddToCart}
                disabled={(hasVariants && (!selectedVariant || selectedVariant.stockQuantity === 0)) ||
                         (isMobileCaseConfig && !selectedModel)}
                className={`w-full py-3 rounded transition-colors text-base font-medium ${
                  (hasVariants && (!selectedVariant || selectedVariant.stockQuantity === 0)) ||
                  (isMobileCaseConfig && !selectedModel)
                    ? 'bg-gray-300 cursor-not-allowed text-gray-700'
                    : 'bg-gray-900 hover:bg-black text-white'
                }`}
              >
                {isMobileCaseConfig && !selectedModel ? 'Select Model First' :
                 hasVariants
                  ? (!selectedVariant ? 'Select Variant' : selectedVariant.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart')
                  : 'Add to Cart'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={(hasVariants && (!selectedVariant || selectedVariant.stockQuantity === 0)) ||
                         (isMobileCaseConfig && !selectedModel)}
                className={`w-full py-3 rounded transition-colors text-base font-medium ${
                  (hasVariants && (!selectedVariant || selectedVariant.stockQuantity === 0)) ||
                  (isMobileCaseConfig && !selectedModel)
                    ? 'bg-gray-300 cursor-not-allowed text-gray-700'
                    : 'bg-black hover:bg-gray-800 text-white'
                }`}
              >
                Buy Now
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )

  return isMobile ? <MobileLayout /> : <DesktopLayout />
}
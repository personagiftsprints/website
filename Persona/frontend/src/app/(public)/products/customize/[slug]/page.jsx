'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getProductBySlug } from '@/services/product.service'
import { getPrintConfigBySlug } from '@/services/printArea.service'
import { addToCart } from '@/lib/cart'
import { uploadImagesToCloudinary } from '@/services/upload.service'


const FONTS = [
  { label: 'Sans', value: 'font-sans' },
  { label: 'Serif', value: 'font-serif' },
  { label: 'Mono', value: 'font-mono' },
  { label: 'Display', value: 'font-bold' }
]

export default function CustomizeProductPage() {
  const { slug } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef(null)

  // FIXED: Added proper type handling for lockedAttributes
  const lockedAttributes = searchParams.get('variant') 
    ? JSON.parse(searchParams.get('variant'))
    : {}

  const [product, setProduct] = useState(null)
  const [config, setConfig] = useState(null)

  const [selectedView, setSelectedView] = useState(null)
  const [selectedArea, setSelectedArea] = useState(null)

  const [designType, setDesignType] = useState('image')
  const [designs, setDesigns] = useState({})

  const [textValue, setTextValue] = useState('')
  const [fontFamily, setFontFamily] = useState(FONTS[0].value)

  const [selectedAttributes, setSelectedAttributes] = useState({})
  const [selectedVariant, setSelectedVariant] = useState(null)

  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /* ---------------- LOAD PRODUCT ---------------- */
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

        const productData = productRes.data
        
        if (!productData.customization?.enabled) {
          setError('Customization not available')
          setLoading(false)
          return
        }

        setProduct(productData)

        const cfg = await getPrintConfigBySlug(
          productData.customization.printConfig.configType
        )

        setConfig(cfg)

        const firstView = Object.keys(cfg.views)[0]
        setSelectedView(firstView)
        setSelectedArea(cfg.views[firstView].areas[0])
      } catch (err) {
        console.error('Failed to load product:', err)
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug, router])

  /* ---------------- LOCK VARIANT ---------------- */
  useEffect(() => {
    if (!product?.productConfig?.attributes) return
    // FIXED: Only set if lockedAttributes has values
    if (Object.keys(lockedAttributes).length > 0) {
      setSelectedAttributes(lockedAttributes)
    }
  }, [product])

  /* ---------------- MATCH VARIANT ---------------- */
  useEffect(() => {
    if (!product?.productConfig?.variants) return

    const match = product.productConfig.variants.find(v =>
      Object.entries(selectedAttributes).every(
        ([k, val]) => v.attributes[k] === val
      )
    )

    setSelectedVariant(match || null)
    setQuantity(1)
  }, [selectedAttributes, product])

  /* ---------------- OPTION DISABLE ---------------- */
  const isOptionDisabled = (code, value) => {
    if (!product?.productConfig?.variants) return true
    
    return !product.productConfig.variants.some(v =>
      v.attributes[code] === value &&
      Object.entries(selectedAttributes).every(
        ([k, v2]) => k === code || v.attributes[k] === v2
      ) &&
      v.stockQuantity > 0
    )
  }

  /* ---------------- PRINT AREA CHANGE ---------------- */
  const handleAreaChange = area => {
    if (product?.type === 'tshirt') {
      const existing = designs[selectedView]?.[selectedArea?.id]
      if (existing && area.id !== selectedArea.id) {
        const ok = window.confirm(
          'You can only select one print position. Change and discard current design?'
        )
        if (!ok) return
      }
    }
    setSelectedArea(area)
  }

  /* ---------------- IMAGE UPLOAD ---------------- */
  const handleImageUpload = e => {
    const file = e.target.files[0]
    if (!file || !selectedArea) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5MB')
      return
    }

    // FIXED: Create object URL for preview
    const imageUrl = URL.createObjectURL(file)
    
    setDesigns(prev => ({
      ...prev,
      [selectedView]: {
        ...prev[selectedView],
        [selectedArea.id]: {
          type: 'image',
          file: file,
          imageUrl: imageUrl, // Add preview URL
          name: file.name
        }
      }
    }))
  }

  /* ---------------- TEXT DESIGN ---------------- */
  useEffect(() => {
    if (designType !== 'text' || !selectedArea || !selectedView) return

    // Only update if we have text or we want to clear existing text design
    if (textValue.trim() || designs[selectedView]?.[selectedArea.id]?.type === 'text') {
      setDesigns(prev => ({
        ...prev,
        [selectedView]: {
          ...prev[selectedView],
          [selectedArea.id]: {
            type: 'text',
            text: textValue,
            font: fontFamily
          }
        }
      }))
    }
  }, [textValue, fontFamily, designType, selectedArea, selectedView])

  /* ---------------- UPLOAD DESIGN IMAGES ---------------- */
  // FIXED: Added missing function

const uploadDesignImages = async designsObj => {
  const files = []
  const indexMap = []

  Object.entries(designsObj).forEach(([viewKey, viewData]) => {
    Object.entries(viewData).forEach(([areaId, design]) => {
      if (design.type === 'image' && design.file) {
        files.push(design.file)
        indexMap.push({ viewKey, areaId })
      }
    })
  })

  if (!files.length) return designsObj

  const uploadedImages = await uploadImagesToCloudinary(files)

  const uploadedDesigns = structuredClone(designsObj)

  uploadedImages.forEach((img, index) => {
    const { viewKey, areaId } = indexMap[index]

    uploadedDesigns[viewKey][areaId] = {
      type: 'image',
      imageUrl: img.url,
      publicId: img.publicId,
      uploaded: true
    }
  })

  return uploadedDesigns
}


const buildCartItem = async () => {
  if (!selectedVariant || !product) return null

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

    variant: selectedVariant.attributes || null,

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
    alert('Please select a variant first')
    return
  }
  addToCart(item)
  alert('Added to cart!')
}


  const handleBuyNow = async () => {
    const item = await buildCartItem()
    if (!item) {
      alert('Please select a variant first')
      return
    }
    addToCart(item)
    router.push('/checkout')
  }

  if (loading) {
    return <div className="fixed inset-0 flex items-center justify-center">Loading…</div>
  }

  if (error) {
    return <div className="fixed inset-0 flex items-center justify-center text-red-500">{error}</div>
  }

  if (!product || !config || !selectedView) {
    return <div className="fixed inset-0 flex items-center justify-center">Product not found</div>
  }

  const viewData = config.views[selectedView]
  const currentDesign = designs[selectedView]?.[selectedArea?.id]

  return (
    <div className="flex h-screen bg-white">
      {/* PRODUCT SIDEBAR */}
      <div className="w-80 border-r p-5 space-y-6 overflow-y-auto">
        <img src={product.thumbnail} alt={product.name} className="w-full rounded" />
        <h2 className="text-xl font-semibold">{product.name}</h2>

        {product.productConfig?.attributes?.map(attr => (
          <div key={attr.code}>
            <p className="text-sm mb-2">{attr.name}</p>
            <div className="flex gap-2 flex-wrap">
              {attr.values?.map(value => (
                <button
                  key={value}
                  disabled={isOptionDisabled(attr.code, value)}
                  onClick={() =>
                    setSelectedAttributes(prev => ({
                      ...prev,
                      [attr.code]: value
                    }))
                  }
                  className={`px-3 py-2 border rounded transition-colors ${
                    selectedAttributes[attr.code] === value
                      ? 'bg-black text-white'
                      : 'hover:bg-gray-100'
                  } ${isOptionDisabled(attr.code, value) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CANVAS */}
      <div className="flex-1 flex items-center justify-center bg-gray-100 relative">
        <img 
          src={viewData.baseImage} 
          alt={`${product.name} - ${selectedView}`} 
          className="max-h-full object-contain" 
        />
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

      {/* RIGHT SIDEBAR */}
      <div className="w-96 border-l p-6 space-y-6 overflow-y-auto">
        <div className="flex gap-2">
          {Object.keys(config.views).map(v => (
            <button
              key={v}
              onClick={() => {
                setSelectedView(v)
                setSelectedArea(config.views[v].areas[0])
              }}
              className={`px-3 py-1 rounded transition-colors ${
                v === selectedView ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {v.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div>
          <h3 className="font-semibold mb-2">Print Area</h3>
          {viewData.areas.map(area => (
            <div
              key={area.id}
              onClick={() => handleAreaChange(area)}
              className={`p-3 border rounded mb-2 cursor-pointer transition-colors ${
                selectedArea?.id === area.id 
                  ? 'border-black bg-black text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {area.name}
            </div>
          ))}
        </div>

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

        {designType === 'text' && (
          <>
            <input
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              placeholder="Enter your text here"
              className="w-full border p-2 rounded"
            />
            <div className="flex gap-2">
              {FONTS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFontFamily(f.value)}
                  className={`px-3 py-1 rounded transition-colors ${
                    fontFamily === f.value ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
                  } ${f.value}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        )}

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

        {currentDesign && (
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium">Current Design:</p>
            <p className="text-sm text-gray-600">
              {currentDesign.type === 'image' 
                ? `Image: ${currentDesign.name || 'Uploaded image'}`
                : `Text: "${currentDesign.text}"`
              }
            </p>
          </div>
        )}

        {selectedVariant && (
          <>
            <p className={`font-medium ${
              selectedVariant.stockQuantity > 10 
                ? 'text-green-600' 
                : selectedVariant.stockQuantity > 0 
                  ? 'text-yellow-600' 
                  : 'text-red-600'
            }`}>
              {selectedVariant.stockQuantity > 0 
                ? `${selectedVariant.stockQuantity} in stock` 
                : 'Out of stock'}
            </p>

            <div className="flex gap-3 items-center">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center border rounded"
                disabled={quantity <= 1}
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                min="1"
                max={selectedVariant.stockQuantity}
                onChange={e => setQuantity(Math.min(selectedVariant.stockQuantity, Math.max(1, Number(e.target.value))))}
                className="w-16 text-center border rounded py-1"
              />
              <button 
                onClick={() => setQuantity(q => Math.min(selectedVariant.stockQuantity, q + 1))}
                className="w-8 h-8 flex items-center justify-center border rounded"
                disabled={quantity >= selectedVariant.stockQuantity}
              >
                +
              </button>
            </div>
          </>
        )}

        <button 
          onClick={handleAddToCart} 
          disabled={!selectedVariant || selectedVariant.stockQuantity === 0}
          className={`w-full py-3 rounded transition-colors ${
            !selectedVariant || selectedVariant.stockQuantity === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gray-900 hover:bg-black text-white'
          }`}
        >
          {!selectedVariant ? 'Select Variant' : 
           selectedVariant.stockQuantity === 0 ? 'Out of Stock' : 
           'Add to Cart'}
        </button>

        <button 
          onClick={handleBuyNow} 
          disabled={!selectedVariant || selectedVariant.stockQuantity === 0}
          className={`w-full py-3 rounded transition-colors ${
            !selectedVariant || selectedVariant.stockQuantity === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800 text-white'
          }`}
        >
          Buy Now
        </button>
      </div>
    </div>
  )
}
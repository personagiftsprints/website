'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getProductBySlug } from '@/services/product.service'
import { getPrintConfigBySlug } from '@/services/printArea.service'

export default function CustomizeProductPage() {
  const { slug } = useParams()
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [product, setProduct] = useState(null)
  const [config, setConfig] = useState(null)
  const [selectedView, setSelectedView] = useState('front')
  const [selectedArea, setSelectedArea] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    // ──────────────────────────────────────────────
    // same loading logic as before (unchanged)
    // ──────────────────────────────────────────────
    if (!slug) return

    const loadProductAndConfig = async () => {
      try {
        setLoading(true)
        setError(null)

        const productRes = await getProductBySlug(slug)
        if (!productRes?.success || !productRes.data) {
          router.push('/404')
          return
        }

        if (!productRes.data.customization?.enabled) {
          setError('Customization is not available for this product')
          return
        }

        setProduct(productRes.data)

        const printConfig = productRes.data.customization?.printConfig
        if (!printConfig?.configType) {
          setError('Print configuration missing')
          return
        }

        const configRes = await getPrintConfigBySlug(printConfig.configType)
        if (!configRes) {
          setError('Failed to load print configuration')
          return
        }

        setConfig(configRes)
        console.log('Print config:', configRes)

        if (configRes.views?.front?.areas?.length > 0) {
          setSelectedArea(configRes.views.front.areas[0])
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load product configuration')
      } finally {
        setLoading(false)
      }
    }

    loadProductAndConfig()
  }, [slug, router])

  const handleImageUpload = e => {
    // same as before...
    const file = e.target.files[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      setError('Invalid image format')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }

    setUploadedImage(file)
    setError(null)

    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        setUploadedImageUrl(URL.createObjectURL(file))
      }
    }, 50)
  }

  const handleRemoveImage = () => {
    setUploadedImage(null)
    setUploadedImageUrl(null)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleViewChange = view => {
    setSelectedView(view)
    if (config?.views?.[view]?.areas?.length > 0) {
      setSelectedArea(config.views[view].areas[0])
    } else {
      setSelectedArea(null)
    }
  }

  const handleProceedToCheckout = () => {
    if (!selectedArea) return

    const params = new URLSearchParams({
      product: product._id,
      configId: product.customization.printConfig.configId,
      view: selectedView,
      area: selectedArea.id,
      ...(uploadedImageUrl && { customImage: 'true' })
    })

    router.push(`/checkout?${params.toString()}`)
  }

  const getAreaDimensions = area => area?.max || 'N/A'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-lg font-medium">Preparing your design studio...</p>
        </div>
      </div>
    )
  }

  if (error || !product || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <p className="text-xl font-semibold text-gray-800 mb-4">
            {error || 'Studio configuration not available'}
          </p>
          <button
            onClick={() => router.back()}
            className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const viewData = config.views?.[selectedView]

  return (
    <div className="min-h-screen bg-gray-800 w-full flex flex-col">
      {/* Top bar — quick view switch + title */}
      <div className="bg-white border-b w-full shadow-sm sticky top-0 z-10">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
            Design Studio — {product.name}
          </h1>

          <div className="flex gap-2">
            {Object.keys(config.views).map(view => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                  selectedView === view
                    ? 'bg-black text-white shadow'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content — flex row on lg, column on mobile */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-8xl  mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* LEFT / CENTER → Big preview area (the "canvas") */}
        <div className="flex-1 flex flex-col gap-6 order-2 lg:order-1">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] relative bg-gray-50 flex items-center justify-center p-4 sm:p-8">
              <img
                src={viewData.baseImage}
                alt={`${selectedView} view`}
                className="max-w-full max-h-full object-contain drop-shadow-2xl"
              />

              {/* Optional overlay hint for selected area */}
              {selectedArea && (
                <div className="absolute inset-0 pointer-events-none">
                  <div
                    className="absolute border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-10 rounded-lg"
                    style={{
                      // You'd calculate real position & size based on selectedArea coords
                      top: '20%',
                      left: '15%',
                      width: '70%',
                      height: '60%'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Reference designs — horizontal scrollable */}
          {selectedArea?.references?.length > 0 && (
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <h2 className="font-semibold text-lg mb-4">Inspiration / References</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                {selectedArea.references.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Reference ${i + 1}`}
                    className="h-32 sm:h-40 w-auto object-cover rounded-lg shadow-sm snap-start flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR → Tools panel */}
        <div className="w-full lg:w-96 lg:max-w-md space-y-6 order-1 lg:order-2">
          {/* Print Areas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-semibold text-lg mb-4">Print Areas</h2>
            <div className="space-y-3">
              {viewData.areas.map(area => (
                <div
                  key={area.id}
                  onClick={() => setSelectedArea(area)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    selectedArea?.id === area.id
                      ? 'border-black bg-gray-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <p className="font-medium">{area.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Max: {getAreaDimensions(area)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Design */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-semibold text-lg mb-4">Your Design</h2>

            {!uploadedImageUrl ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-gray-600 font-medium">Drop image here or click to upload</p>
                <p className="text-sm text-gray-500 mt-2">JPG, PNG, WEBP, SVG • max 5MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden shadow-sm">
                <img
                  src={uploadedImageUrl}
                  alt="Uploaded design"
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 bg-red-600 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition"
                >
                  ✕
                </button>
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-black h-2.5 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="bg-white border-t shadow-inner mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="px-8 py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition w-full sm:w-auto"
          >
            Cancel
          </button>

          <button
            disabled={!selectedArea}
            onClick={handleProceedToCheckout}
            className="px-10 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  )
}
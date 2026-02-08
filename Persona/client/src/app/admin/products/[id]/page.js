"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  uploadImagesAPI,
  updateProductAPI,
  getProductById
} from "@/services/product.service"
import { Trash2, Star, GripVertical, Upload, Save, AlertCircle, ArrowLeft, X } from "lucide-react"

/* ---------------- SORTABLE IMAGE ---------------- */

function SortableImage({ img, onRemove, onSetMain }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: img.localId })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
      }}
      className={`group relative rounded-xl overflow-hidden bg-gray-50 ${
        img.isMain ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg cursor-grab active:cursor-grabbing shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={16} className="text-gray-600" />
      </div>

      {/* Main Badge */}
      {img.isMain && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md font-medium z-10">
          Main
        </div>
      )}

      {/* Image */}
      <img src={img.url} className="w-full aspect-square object-cover" alt="" />

      {/* Hover Actions */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-2 p-3">
        {!img.isMain && (
          <button
            onClick={() => onSetMain(img.localId)}
            className="bg-white hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <Star size={14} />
            Set Main
          </button>
        )}
        <button
          onClick={() => onRemove(img.localId)}
          className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

/* ---------------- MAIN PAGE ---------------- */

export default function EditProductPage() {
  const { id } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [images, setImages] = useState([])

  const [form, setForm] = useState({
    name: "",
    description: "",
    material: "",
    basePrice: "",
    specialPrice: "",
    stockQuantity: "",
    isActive: true
  })

  const fileInputRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const isVariantProduct =
    product?.type === "tshirt" &&
    product?.productConfig?.variants?.length > 0

  /* ---------------- LOAD PRODUCT ---------------- */

  useEffect(() => {
    getProductById(id)
      .then(res => {
        const p = res.data
        setProduct(p)

        setForm({
          name: p.name,
          description: p.description || "",
          material: p.material || "",
          basePrice: String(p.pricing.basePrice),
          specialPrice: p.pricing.specialPrice?.toString() || "",
          stockQuantity: String(p.inventory.stockQuantity || 0),
          isActive: p.isActive
        })

        if (p.type === "tshirt" && p.productConfig?.variants) {
          setVariants(
            p.productConfig.variants.map(v => ({
              sku: v.sku,
              attributes: v.attributes,
              stockQuantity: v.stockQuantity
            }))
          )
        }

        setImages(
          p.images.map(img => ({
            ...img,
            localId: crypto.randomUUID(),
            isNew: false
          }))
        )
      })
      .catch(() => setError("Failed to load product"))
      .finally(() => setLoading(false))
  }, [id])

  /* ---------------- IMAGE HANDLERS ---------------- */

  const handleAddImages = e => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setImages(prev => [
      ...prev,
      ...files.map(file => ({
        localId: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        isNew: true,
        isMain: false
      }))
    ])
  }

  const handleRemove = id =>
    setImages(prev => prev.filter(i => i.localId !== id))

  const handleSetMain = id =>
    setImages(prev =>
      prev.map(i => ({ ...i, isMain: i.localId === id }))
    )

  const handleDragEnd = e => {
    if (!e.over) return
    setImages(items =>
      arrayMove(
        items,
        items.findIndex(i => i.localId === e.active.id),
        items.findIndex(i => i.localId === e.over.id)
      )
    )
  }

  /* ---------------- SAVE ---------------- */

  const handleSave = async () => {
    setSaving(true)
    setError("")

    try {
      const newImages = images.filter(i => i.isNew)
      const uploaded = newImages.length
        ? await uploadImagesAPI(newImages.map(i => i.file))
        : []

      let uploadIndex = 0
      const finalImages = images.map((img, i) =>
        img.isNew
          ? {
              url: uploaded[uploadIndex].url,
              publicId: uploaded[uploadIndex++].publicId,
              isMain: i === 0,
              order: i + 1
            }
          : {
              url: img.url,
              publicId: img.publicId,
              isMain: i === 0,
              order: i + 1
            }
      )

      const payload = {
        name: form.name,
        description: form.description,
        material: form.material,
        isActive: form.isActive,
        pricing: {
          basePrice: Number(form.basePrice),
          specialPrice: form.specialPrice
            ? Number(form.specialPrice)
            : null
        },
        images: finalImages
      }

      if (isVariantProduct) {
        payload.productConfig = {
          ...product.productConfig,
          variants: variants.map(v => ({
            ...v,
            stockQuantity: Number(v.stockQuantity)
          }))
        }
        payload.inventory = { manageStock: false }
      } else {
        payload.inventory = {
          manageStock: true,
          stockQuantity: Number(form.stockQuantity)
        }
      }

      await updateProductAPI(id, payload)
      router.push("/admin/products")
    } catch (e) {
      setError(e.message || "Failed to update product")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin/products")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Edit Product</h1>
                <p className="text-sm text-gray-500 mt-0.5">Update product information and images</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/products")}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
              <X size={18} />
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Product Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    rows={4}
                    placeholder="Enter product description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material
                  </label>
                  <input
                    type="text"
                    value={form.material}
                    onChange={e => setForm({ ...form, material: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g., 100% Cotton"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={form.basePrice}
                      onChange={e => setForm({ ...form, basePrice: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Price <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={form.specialPrice}
                      onChange={e => setForm({ ...form, specialPrice: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
              
              {!isVariantProduct ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={form.stockQuantity}
                    onChange={e => setForm({ ...form, stockQuantity: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3">Manage stock by variant</p>
                  {variants.map((v, i) => (
                    <div key={v.sku} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {Object.values(v.attributes).join(" / ")}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">SKU: {v.sku}</p>
                      </div>
                      <input
                        type="number"
                        className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        value={v.stockQuantity}
                        onChange={e => {
                          const copy = [...variants]
                          copy[i].stockQuantity = Number(e.target.value)
                          setVariants(copy)
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <p className="font-medium text-gray-900">Active Product</p>
                  <p className="text-sm text-gray-500">Product will be visible to customers</p>
                </div>
              </label>
            </div>
          </div>

          {/* Right Column - Images */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                hidden
                onChange={handleAddImages}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-8 text-center transition-colors group mb-4"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-50 rounded-full flex items-center justify-center transition-colors">
                    <Upload size={20} className="text-gray-600 group-hover:text-blue-600" />
                  </div>
                  <p className="font-medium text-gray-900">Upload Images</p>
                  <p className="text-sm text-gray-500">Click to browse</p>
                </div>
              </button>

              {images.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {images.length} {images.length === 1 ? "image" : "images"}
                  </p>
                  
                  <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={images.map(i => i.localId)} 
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {images.map(img => (
                          <SortableImage
                            key={img.localId}
                            img={img}
                            onRemove={handleRemove}
                            onSetMain={handleSetMain}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <p className="text-xs text-gray-500 mt-3">
                    Drag to reorder • First image is the main image
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
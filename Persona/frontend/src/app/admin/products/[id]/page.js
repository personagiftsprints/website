"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  uploadImagesAPI, 
  updateProductAPI, 
  getProductById, 
  updateProduct
} from "@/services/product.service"

import { Trash2, Star, GripVertical, Upload, Save, AlertCircle } from "lucide-react"

function SortableImage({ img, onRemove, onSetMain }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: img.localId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    scale: isDragging ? 1.05 : 1,
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`
        relative group rounded-lg overflow-hidden border-2 
        ${img.isMain ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
        ${isDragging ? 'shadow-2xl z-20' : ''}
        transition-all duration-200
      `}
    >
      {/* Drag handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-2 left-2 z-10 bg-white/80 p-1.5 rounded-full cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={18} className="text-gray-600" />
      </div>

      {/* Image */}
      <img 
        src={img.url} 
        alt={img.name || "Product image"}
        className="w-full aspect-square object-cover"
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        {img.isMain ? (
          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
            <Star size={16} fill="white" /> Main Image
          </div>
        ) : (
          <button
            onClick={() => onSetMain(img.localId)}
            className="bg-white/90 hover:bg-white text-gray-800 px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <Star size={16} /> Set as Main
          </button>
        )}

        <button
          onClick={() => onRemove(img.localId)}
          className="bg-red-500/90 hover:bg-red-600 text-white p-2.5 rounded-full transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* New image indicator */}
      {img.isNew && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          New
        </div>
      )}
    </div>
  )
}

export default function EditProductPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  
  const [product, setProduct] = useState(null)
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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch product
  useEffect(() => {
    getProductById(id)
      .then(res => {
        const p = res.data
        setProduct(p)
        setForm({
          name: p.name,
          description: p.description || "",
          material: p.material || "",
          basePrice: p.pricing.basePrice.toString(),
          specialPrice: p.pricing.specialPrice?.toString() || "",
          stockQuantity: p.inventory.stockQuantity.toString(),
          isActive: p.isActive
        })
        setImages(
          p.images.map(img => ({
            ...img,
            localId: crypto.randomUUID(),
            isNew: false,
            url: img.url // cloudinary url
          }))
        )
      })
      .catch(() => setError("Failed to load product"))
      .finally(() => setLoading(false))
  }, [id])

  // Add new images
  const handleAddImages = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const newImages = files.map(file => ({
      localId: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      isNew: true,
      isMain: false,
      name: file.name
    }))

    setImages(prev => [...prev, ...newImages])
  }

  // Remove image
  const handleRemove = useCallback((localId) => {
    setImages(prev => prev.filter(i => i.localId !== localId))
  }, [])

  // Set main image
  const handleSetMain = useCallback((localId) => {
    setImages(prev =>
      prev.map(i => ({
        ...i,
        isMain: i.localId === localId
      }))
    )
  }, [])

  // Drag end - reorder
  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setImages(items => {
      const oldIndex = items.findIndex(i => i.localId === active.id)
      const newIndex = items.findIndex(i => i.localId === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  // Save everything
  const handleSave = async () => {
    setSaving(true)
    setError("")

    try {
      // Upload only new images
      const newImages = images.filter(i => i.isNew)
      let uploadedImages = []

      if (newImages.length > 0) {
        uploadedImages = await uploadImagesAPI(newImages.map(i => i.file))
      }
let uploadIndex = 0

const finalImages = images.map((img, index) => {
  if (img.isNew) {
    const uploaded = uploadedImages[uploadIndex++]

    return {
      url: uploaded.url,
      publicId: uploaded.publicId,
      order: index + 1,
      isMain: index === 0
    }
  }

  return {
    url: img.url,
    publicId: img.publicId,
    order: index + 1,
    isMain: index === 0
  }
})

  .sort((a, b) => a.order - b.order);   // just to be sure

// ── only send what backend really needs ──a
await updateProductAPI(id, {
  name: form.name.trim(),
  description: form.description.trim(),
  material: form.material.trim(),
  isActive: form.isActive,
  pricing: {
    basePrice: Number(form.basePrice) || 0,
    specialPrice: form.specialPrice ? Number(form.specialPrice) : null
  },
  inventory: {
    stockQuantity: Number(form.stockQuantity) || 0
  },
  images: finalImages             // ← this array of objects
});

      router.push("/admin/products")
    } catch (err) {
      setError(err.message || "Failed to update product")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading product...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/products")}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium
              ${saving 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
              }
              transition-colors
            `}
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left column - Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">Product Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Premium Cotton T-Shirt"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={5}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your product..."
            />
          </div>

          <div>
  <label className="block text-sm font-medium mb-1.5">
    Stock Quantity
  </label>
  <input
    type="number"
    min="0"
    value={form.stockQuantity}
    onChange={e =>
      setForm(f => ({
        ...f,
        stockQuantity: e.target.value.replace(/\D/g, "")
      }))
    }
    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="e.g. 120"
  />
</div>


          {/* More fields can be added similarly */}
        </div>

        {/* Right column - Images */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Product Images</h2>
            <label className="cursor-pointer">
              <span className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                <Upload size={18} />
                Add Images
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleAddImages}
                className="hidden"
              />
            </label>
          </div>

          {images.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500">
              No images yet. Click "Add Images" to upload.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={images.map(i => i.localId)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
          )}

          <p className="mt-3 text-sm text-gray-500">
            Drag images to reorder • First image will be the main/thumbnail
          </p>
        </div>
      </div>
    </div>
  )
}
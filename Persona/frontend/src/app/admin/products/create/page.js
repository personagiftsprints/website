"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Palette, Upload, X } from "lucide-react"

import ProductLivePreview from "@/components/product/ProductLivePreview"
import { createProduct } from "@/services/product.service"

const PRINT_AREA_PRESETS = {
  tshirt: [
    { areaId: "front", label: "Front Print", allowedTypes: ["image", "text"], maxImages: 1 },
    { areaId: "back", label: "Back Print", allowedTypes: ["image", "text"], maxImages: 1 },
    { areaId: "sleeve", label: "Sleeve Print", allowedTypes: ["image", "text"], maxImages: 1 }
  ],
  mug: [
    { areaId: "front", label: "Front Side", allowedTypes: ["image", "text"], maxImages: 1 },
    { areaId: "back", label: "Back Side", allowedTypes: ["image", "text"], maxImages: 1 },
    { areaId: "wrap", label: "Full Wrap", allowedTypes: ["image", "text"], maxImages: 1 }
  ],
  "photo-frame": [
    { areaId: "full", label: "Full Image", allowedTypes: ["image"], maxImages: 1 }
  ]
}

export default function CreateProduct() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [itemType, setItemType] = useState("")
  const [category, setCategory] = useState("")
  const [productType, setProductType] = useState("normal")
  const [basePrice, setBasePrice] = useState("")
  const [sizes, setSizes] = useState("")
  const [colors, setColors] = useState("")
  const [materials, setMaterials] = useState("")
  const [areas, setAreas] = useState([])
  const [initialStock, setInitialStock] = useState("")
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)

  const handleItemTypeChange = value => {
    setItemType(value)
    setAreas(
      PRINT_AREA_PRESETS[value]
        ? PRINT_AREA_PRESETS[value].map(a => ({ ...a, enabled: true }))
        : []
    )
  }

  const handlePhotoUpload = e => {
    const files = Array.from(e.target.files)
    if (photos.length + files.length > 5) return
    setPhotos(prev => [...prev, ...files])
  }

  const removePhoto = index => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const updateArea = (index, key, value) => {
    const copy = [...areas]
    copy[index] = { ...copy[index], [key]: value }
    setAreas(copy)
  }

const submit = async () => {
  if (!name || !itemType || !category || !basePrice) return

  const data = {
    name,
    itemType,
    category,
    productType,
    basePrice: Number(basePrice),
    stock: initialStock ? Number(initialStock) : 0,
    variants: {
      sizes: sizes ? sizes.split(",").map(v => v.trim()) : [],
      colors: colors ? colors.split(",").map(v => v.trim()) : [],
      materials: materials ? materials.split(",").map(v => v.trim()) : []
    },
    ...(productType === "personalized" && {
      personalizationConfig: {
        areas: areas.filter(a => a.enabled)
      }
    })
  }

  try {
    setLoading(true)

    await createProduct(data, photos)

    router.push("/admin/products")
  } catch (err) {
    console.error(err.message)
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* LEFT FORM */}
      <div className="lg:col-span-2 space-y-8">

        <div>
          <p className="text-sm text-gray-500">Admin / Products</p>
          <h1 className="text-2xl font-semibold">Create Product</h1>
        </div>

        {/* Images */}
        <section className="bg-white p-6 rounded-xl">
          <label className="block text-sm font-medium mb-3">Product Images (Max 5)</label>
          <div className="flex flex-wrap gap-4">
            {photos.map((file, index) => (
              <div key={index} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                <button onClick={() => removePhoto(index)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1">
                  <X size={14} />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <label className="w-24 h-24 border-dashed border rounded-lg flex items-center justify-center cursor-pointer">
                <Upload className="text-gray-400" />
                <input type="file" accept="image/*" multiple hidden onChange={handlePhotoUpload} />
              </label>
            )}
          </div>
        </section>

        {/* Basic Info */}
        <section className="bg-white p-6 grid md:grid-cols-2 gap-6">
          <input className="border px-4 py-2" placeholder="Product Name *" value={name} onChange={e => setName(e.target.value)} />

          <select className="border px-4 py-2" value={itemType} onChange={e => handleItemTypeChange(e.target.value)}>
            <option value="">Select Item *</option>
            <option value="tshirt">T-Shirt / Hoodie</option>
            <option value="mug">Mug</option>
            <option value="photo-frame">Photo Frame</option>
          </select>

          <input className="border px-4 py-2" placeholder="Category *" value={category} onChange={e => setCategory(e.target.value)} />

          <select className="border px-4 py-2" value={productType} onChange={e => setProductType(e.target.value)}>
            <option value="normal">Normal</option>
            <option value="personalized">Personalized</option>
          </select>
        </section>

        {/* Pricing & Variants */}
        <section className="bg-white p-6 grid md:grid-cols-2 gap-6">
          <input type="number" className="border px-4 py-2" placeholder="Base Price *" value={basePrice} onChange={e => setBasePrice(e.target.value)} />

          {itemType === "tshirt" && (
            <select className="border px-4 py-2" value={sizes} onChange={e => setSizes(e.target.value)}>
              <option value="">Select Sizes</option>
              <option value="S,M,L">S, M, L</option>
              <option value="S,M,L,XL">S, M, L, XL</option>
              <option value="S,M,L,XL,XXL">S, M, L, XL, XXL</option>
            </select>
          )}

          <input className="border px-4 py-2" placeholder="Colors (comma separated)" value={colors} onChange={e => setColors(e.target.value)} />

          <input className="border px-4 py-2" placeholder="Materials (comma separated)" value={materials} onChange={e => setMaterials(e.target.value)} />

          <input type="number" min="0" className="border px-4 py-2" placeholder="Initial Stock" value={initialStock} onChange={e => setInitialStock(e.target.value)} />
        </section>

        {/* Print Areas */}
        {productType === "personalized" && areas.length > 0 && (
          <section className="bg-white border rounded-xl p-6">
            <h2 className="flex items-center gap-2 font-medium mb-6">
              <Palette className="text-purple-600" />
              Print Areas
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {areas.map((area, index) => (
                <div key={area.areaId} className="border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{area.label}</p>
                    <p className="text-xs text-gray-500">{area.allowedTypes.join(", ")}</p>
                  </div>
                  <input type="checkbox" checked={area.enabled} onChange={e => updateArea(index, "enabled", e.target.checked)} />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-end">
          <button disabled={loading} onClick={submit} className="px-10 py-3 bg-black text-white rounded-xl">
            {loading ? "Creating..." : "Create Product"}
          </button>
        </div>
      </div>

      {/* RIGHT PREVIEW */}
      <ProductLivePreview
        name={name}
        category={category}
        itemType={itemType}
        price={basePrice}
        photos={photos}
      />
    </div>
  )
}

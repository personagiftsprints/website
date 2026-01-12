"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import { Package, Tag, Palette } from "lucide-react"

import ProductLivePreview from "@/components/product/ProductLivePreview"

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/products`

export default function EditProductPage() {
  const { id } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)

  const [name, setName] = useState("")
  const [itemType, setItemType] = useState("")
  const [category, setCategory] = useState("")
  const [productType, setProductType] = useState("normal")
  const [basePrice, setBasePrice] = useState("")
  const [sizes, setSizes] = useState("")
  const [colors, setColors] = useState("")
  const [materials, setMaterials] = useState("")
  const [stock, setStock] = useState("")
  const [areas, setAreas] = useState([])

  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])

  const fetchProduct = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/${id}`)

      setName(data.name)
      setItemType(data.itemType)
      setCategory(data.category)
      setProductType(data.productType)
      setBasePrice(data.basePrice)
      setStock(data.stock ?? 0)
      setSizes(data.variants?.sizes?.join(",") || "")
      setColors(data.variants?.colors?.join(",") || "")
      setMaterials(data.variants?.materials?.join(",") || "")
      setAreas(
        data.personalizationConfig?.areas?.map(a => ({
          ...a,
          enabled: true
        })) || []
      )
      setExistingImages(data.images || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProduct()
  }, [])

  const move = (list, setList, from, to) => {
    const copy = [...list]
    const item = copy.splice(from, 1)[0]
    copy.splice(to, 0, item)
    setList(copy)
  }

  const submit = async () => {
    const payload = {
      name,
      itemType,
      category,
      productType,
      basePrice: Number(basePrice),
      stock: Number(stock),
      variants: {
        sizes: sizes ? sizes.split(",").map(v => v.trim()) : [],
        colors: colors ? colors.split(",").map(v => v.trim()) : [],
        materials: materials ? materials.split(",").map(v => v.trim()) : []
      },
      images: existingImages,
      ...(productType === "personalized" && {
        personalizationConfig: {
          areas: areas.filter(a => a.enabled)
        }
      })
    }

    const formData = new FormData()
    formData.append("data", JSON.stringify(payload))
    newImages.forEach(f => formData.append("images", f))

    await axios.put(`${API_BASE}/${id}`, formData)
    router.push("/admin/products")
  }

  if (loading) return <p className="p-8">Loading…</p>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">

      <div className="lg:col-span-2 space-y-6">

        <section className="bg-white border p-6 rounded">
          <h2 className="flex items-center gap-2 font-medium">
            <Package size={16} /> Product
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <input value={name} onChange={e => setName(e.target.value)} className="border px-3 py-2" placeholder="Name" />
            <input value={itemType} onChange={e => setItemType(e.target.value)} className="border px-3 py-2" placeholder="Item Type" />
            <input value={category} onChange={e => setCategory(e.target.value)} className="border px-3 py-2" placeholder="Category" />
            <select value={productType} onChange={e => setProductType(e.target.value)} className="border px-3 py-2">
              <option value="normal">Normal</option>
              <option value="personalized">Personalized</option>
            </select>
          </div>
        </section>

        <section className="bg-white border p-6 rounded space-y-4">
          <h2 className="flex items-center gap-2 font-medium">
            <Tag size={16} /> Pricing
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} className="border px-3 py-2" placeholder="Price" />
            <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="border px-3 py-2" placeholder="Stock" />
            <input value={sizes} onChange={e => setSizes(e.target.value)} className="border px-3 py-2" placeholder="Sizes" />
            <input value={colors} onChange={e => setColors(e.target.value)} className="border px-3 py-2" placeholder="Colors" />
            <input value={materials} onChange={e => setMaterials(e.target.value)} className="border px-3 py-2" placeholder="Materials" />
          </div>
        </section>

        <section className="bg-white border p-6 rounded space-y-4">
          <h2 className="font-medium">Images</h2>

          <input type="file" multiple accept="image/*"
            onChange={e => setNewImages(prev => [...prev, ...Array.from(e.target.files)])} />

          {[...existingImages].map((img, i) => (
            <div key={img} className="flex gap-2 items-center">
              <img src={img} className="w-14 h-14 object-cover rounded" />
              <button onClick={() => move(existingImages, setExistingImages, i, i - 1)}>↑</button>
              <button onClick={() => move(existingImages, setExistingImages, i, i + 1)}>↓</button>
              <button onClick={() => setExistingImages(existingImages.filter((_, x) => x !== i))}>✕</button>
            </div>
          ))}

          {newImages.map((f, i) => (
            <div key={f.name + i} className="flex gap-2 items-center">
              <img src={URL.createObjectURL(f)} className="w-14 h-14 object-cover rounded" />
              <button onClick={() => move(newImages, setNewImages, i, i - 1)}>↑</button>
              <button onClick={() => move(newImages, setNewImages, i, i + 1)}>↓</button>
              <button onClick={() => setNewImages(newImages.filter((_, x) => x !== i))}>✕</button>
            </div>
          ))}
        </section>

        <div className="flex justify-end gap-4">
          <button onClick={() => router.back()} className="border px-6 py-2">Cancel</button>
          <button onClick={submit} className="bg-black text-white px-6 py-2">Update</button>
        </div>
      </div>

      <ProductLivePreview
        name={name}
        category={category}
        itemType={itemType}
        price={basePrice}
        photos={[...existingImages, ...newImages]}
        isRemoteImages
      />
    </div>
  )
}

"use client"
import { useState, useEffect } from "react"
import { uploadImagesAPI } from "@/services/product.service"
import { createDesign } from "@/services/design.service"
import { getCategories, getSubcategoriesByCategory } from "@/services/category.service"

export default function AddDesignPage() {
  const [title, setTitle] = useState("")
  const [product, setProduct] = useState("")
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [category, setCategory] = useState("")
  const [subcategory, setSubcategory] = useState("")
  const [image, setImage] = useState(null)
  const [active, setActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tags, setTags] = useState("")

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (category) {
      loadSubcategories(category)
    } else {
      setSubcategories([])
      setSubcategory("")
    }
  }, [category])

  const loadCategories = async () => {
    try {
      const res = await getCategories({ activeOnly: true })
      setCategories(res || [])
    } catch (err) {
      console.error("Failed to load categories", err)
    }
  }

  const loadSubcategories = async (catId) => {
    try {
      const res = await getSubcategoriesByCategory(catId, { activeOnly: true })
      setSubcategories(res || [])
    } catch (err) {
      console.error("Failed to load subcategories", err)
    }
  }

  const handleSave = async () => {
    // Validation
    if (!title || !product || !image || !category) {
      alert("Please fill in all fields (Title, Product Type, Category, Image).")
      return
    }

    try {
      setIsSubmitting(true)

      // 1. Upload to Cloudinary
      const uploadResults = await uploadImagesAPI([image])
      if (!uploadResults || !uploadResults[0]?.url) {
        throw new Error("Failed to upload image to Cloudinary")
      }

      const { url: imageUrl, publicId } = uploadResults[0]

      // 2. Save to Database
      const designData = {
        name: title,
        productType: product,
        category: category,
        subcategory: subcategory || null,
        imageUrl: imageUrl,
        publicId: publicId,
        isActive: active,
        metadata: {
          defaultScale: 0.5,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        }
      }

      await createDesign(designData)
      
      alert("✅ Design saved successfully!")
      
      // Reset form
      setTitle("")
      setProduct("")
      setImage(null)
      setTags("")
      
    } catch (err) {
      console.error("Error saving design:", err)
      alert("❌ Failed to save design: " + (err.response?.data?.message || err.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border">
        <h1 className="text-2xl font-bold text-gray-800">Add New Design</h1>
        <button 
          onClick={() => window.history.back()}
          className="text-gray-500 hover:text-black transition-colors"
        >
          Back
        </button>
      </div>

      <div className="bg-white border p-6 rounded-2xl shadow-sm space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                Design Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-black outline-none transition-all"
                placeholder="e.g. Vintage Rock Style"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-black outline-none transition-all"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                Subcategory (Optional)
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-black outline-none transition-all"
                disabled={!category || subcategories.length === 0}
              >
                <option value="">Select Subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub._id} value={sub._id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                Technical Template Type
              </label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-black outline-none transition-all"
              >
                <option value="">Select template type</option>
                <option value="tshirt">T-Shirt</option>
                <option value="hoodie">Hoodie</option>
                <option value="mug">Mug</option>
                <option value="hat">Hat</option>
                <option value="normal">Generic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-black outline-none transition-all"
                placeholder="vintage, cool, dark, retro"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <input
                type="checkbox"
                id="active"
                className="w-5 h-5 accent-black rounded cursor-pointer"
                checked={active}
                onChange={() => setActive(!active)}
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700 cursor-pointer">
                Publish this design (Active)
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">
              Design Image
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[200px] bg-gray-50 relative overflow-hidden">
              {image ? (
                <div className="relative w-full aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden border">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-4xl mb-2">🖼️</span>
                  <p className="text-xs text-gray-500 text-center">Click to upload or drag & drop</p>
                  <p className="text-[10px] text-gray-400 mt-1">PNG, JPG or SVG</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
              isSubmitting 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-black text-white hover:bg-gray-800 active:scale-95 shadow-black/20"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving Design...
              </div>
            ) : "Save Design"}
          </button>
        </div>
      </div>
    </div>
  )
}

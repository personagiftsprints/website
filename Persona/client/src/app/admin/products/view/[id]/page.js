"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getProductById } from "@/services/product.service"
import { Pencil, CheckCircle2, EyeOff, Copy } from "lucide-react"

export default function ViewProductPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("details")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return

    setLoading(true)
    getProductById(id)
      .then(res => setProduct(res?.data || null))
      .catch(() => setError("Failed to load product"))
      .finally(() => setLoading(false))
  }, [id])


  const handleCopy = async () => {
  if (!product?.sku) return
  try {
    await navigator.clipboard.writeText(product.sku)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  } catch (err) {
    console.error("Copy failed")
  }
}
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading product…
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error || "Product not found"}
      </div>
    )
  }

  const isVariantProduct =
    product.type === "tshirt" &&
    Array.isArray(product.productConfig?.variants)

  const hasCustomization = product.customization?.enabled === true

return (
  <div className="max-w-7xl mx-auto p-8 space-y-10">

    {/* HEADER */}
    <div className="flex items-start justify-between border-b pb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {product.name}
        </h1>
     <div className="flex items-center gap-2 text-gray-500 mt-1 text-sm">
  <span>SKU: {product.sku}</span>

  <button
    onClick={handleCopy}
    className="hover:text-indigo-600 transition-colors"
    title="Copy SKU"
  >
    <Copy size={16} />
  </button>

  {copied && (
    <span className="text-green-600 text-xs font-medium">
      Copied
    </span>
  )}
</div>
        <p className="text-gray-400 text-sm">
          /{product.slug}
        </p>
      </div>

      <button
        onClick={() => router.push(`/admin/products/${id}`)}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
      >
        <Pencil size={18} />
        Edit Product
      </button>
    </div>

    {/* STATUS BADGES */}
    <div className="flex flex-wrap gap-3">
      {product.isActive ? (
        <span className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-full bg-green-100 text-green-700">
          <CheckCircle2 size={16} /> Active
        </span>
      ) : (
        <span className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-full bg-gray-200 text-gray-600">
          <EyeOff size={16} /> Inactive
        </span>
      )}

      {hasCustomization && (
        <span className="px-4 py-1.5 text-sm rounded-full bg-indigo-100 text-indigo-700">
          Customizable
        </span>
      )}

      {isVariantProduct && (
        <span className="px-4 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700">
          Variant Based
        </span>
      )}
    </div>

    {/* MAIN GRID */}
    <div className="grid lg:grid-cols-2 gap-12">

      {/* IMAGE SECTION */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Product Images
        </h2>

        {product.images?.length ? (
          <>
            {/* Main Image Preview */}
            <div className="border rounded-xl overflow-hidden mb-4">
              <img
                src={
                  product.images.find(img => img.isMain)?.url ||
                  product.images[0].url
                }
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-4 gap-3">
              {product.images.map(img => (
                <div
                  key={img.publicId || img.url}
                  className={`border rounded-lg overflow-hidden ${
                    img.isMain
                      ? "border-indigo-500"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-24 object-cover"
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-400">
            No images available
          </div>
        )}
      </div>

   <div>

  {/* TABS HEADER */}
  <div className="border-b mb-6 flex gap-6">
    <button
      onClick={() => setActiveTab("details")}
      className={`pb-3 text-sm font-medium transition ${
        activeTab === "details"
          ? "border-b-2 border-indigo-600 text-indigo-600"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      Details
    </button>

    {isVariantProduct && (
      <button
        onClick={() => setActiveTab("variants")}
        className={`pb-3 text-sm font-medium transition ${
          activeTab === "variants"
            ? "border-b-2 border-indigo-600 text-indigo-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Variants
      </button>
    )}
  </div>

  {/* DETAILS TAB */}
  {activeTab === "details" && (
    <div className="space-y-8">

      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">
          Description
        </h3>
        <p className="text-gray-800 leading-relaxed">
          {product.description || "—"}
        </p>
      </div>

      <div className="border rounded-xl p-6 bg-white shadow-sm grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-gray-500">Base Price</p>
          <p className="text-lg font-semibold mt-1">
            £{product.pricing?.basePrice ?? "—"}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Special Price</p>
          <p className="text-lg font-semibold mt-1">
            {product.pricing?.specialPrice
              ? `£${product.pricing.specialPrice}`
              : "—"}
          </p>
        </div>

        {!isVariantProduct && (
          <div>
            <p className="text-xs text-gray-500">Stock Quantity</p>
            <p className="text-lg font-semibold mt-1">
              {product.inventory?.stockQuantity ?? "—"}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-500">Material</p>
          <p className="text-lg font-semibold mt-1">
            {product.material || "—"}
          </p>
        </div>
      </div>
    </div>
  )}

  {/* VARIANTS TAB */}
  {activeTab === "variants" && isVariantProduct && (
    <div className="border rounded-xl bg-white shadow-sm">

      <div className="px-6 py-4 border-b">
        <h3 className="text-sm font-semibold text-gray-700">
          Variant Inventory
        </h3>
      </div>

      <div className="divide-y">
        {product.productConfig.variants.map(v => (
          <div
            key={v.sku}
            className="grid grid-cols-2 px-6 py-4 text-sm"
          >
            <span className="font-medium">
              {Object.values(v.attributes).join(" / ")}
            </span>
            <span className="text-right text-gray-600">
              Stock: {v.stockQuantity}
            </span>
          </div>
        ))}
      </div>
    </div>
  )}

</div>
    </div>
  </div>
)
}

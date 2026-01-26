"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  getProductBySlug,
  getProductsByType
} from "@/services/product.service"
import { addToCart } from "@/lib/cart"

export default function ProductDetailPage() {
  const { slug } = useParams()
  const router = useRouter()

  const [product, setProduct] = useState(null)
  const [similarProducts, setSimilarProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [selectedAttributes, setSelectedAttributes] = useState({})
const [selectedVariant, setSelectedVariant] = useState(null)


useEffect(() => {
  if (!product?.productConfig?.variants) return

  const match = product.productConfig.variants.find(v =>
    Object.entries(selectedAttributes).every(
      ([key, value]) => v.attributes[key] === value
    )
  )

  setSelectedVariant(match || null)
}, [selectedAttributes, product])


  useEffect(() => {
    if (!slug) return

    const fetchProduct = async () => {
      try {
        const res = await getProductBySlug(slug)
        if (res?.success) {
          setProduct(res.data)

          const mainImg =
            res.data.images?.find(img => img.isMain)?.url ||
            res.data.thumbnail

          setActiveImage(mainImg)

          const similarRes = await getProductsByType(res.data.type)
          if (similarRes?.success) {
            setSimilarProducts(
              similarRes.data.filter(p => p._id !== res.data._id)
            )
          }
        }
      } catch {
        router.push("/404")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug, router])

  useEffect(() => {
    const handleEsc = e => {
      if (e.key === "Escape") setPreviewOpen(false)
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [])

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>
  }

  if (!product) {
    return <div className="p-10 text-center">Product not found</div>
  }

  const { pricing, customization, inventory } = product
  const price = pricing.specialPrice ?? pricing.basePrice

const handleAddToCart = () => {
  addToCart({
    id: crypto.randomUUID(),
    productId: product._id,
    slug: product.slug, // ✅ ADD THIS
    name: product.name,
    image: activeImage,
    price,
    quantity,
    isCustom: false,
    design: null,
    addedAt: Date.now()
  })
  setAdded(true)
}


  const handleBuyNow = () => {
    handleAddToCart()
    router.push("/cart")
  }

  const isOutOfStock =
  product.productConfig?.variants?.length > 0 &&
  (!selectedVariant || selectedVariant.stockQuantity === 0)

  const isConfigRequired =
  product.customization?.enabled &&
  product.productConfig?.variants?.length > 0

const isConfigSelected =
  !isConfigRequired ||
  (selectedVariant && selectedVariant.stockQuantity > 0)


  return (
    <>
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-4">
          <img
            src={activeImage}
            onClick={() => setPreviewOpen(true)}
            className="w-full h-[420px] object-cover rounded-xl cursor-zoom-in"
            alt={product.name}
          />

          <div className="flex gap-3">
            {product.images?.map(img => (
              <img
                key={img.publicId}
                src={img.url}
                onClick={() => setActiveImage(img.url)}
                className={`w-20 h-20 object-cover rounded-lg border cursor-pointer ${
                  activeImage === img.url ? "border-black" : ""
                }`}
                alt=""
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <p className="text-gray-600">{product.description}</p>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold">
              {pricing.currency} {price}
            </span>

            {pricing.discountPercentage > 0 && (
              <>
                <span className="line-through text-gray-400">
                  {pricing.currency} {pricing.basePrice}
                </span>
                <span className="text-green-600 font-medium">
                  {pricing.discountPercentage}% OFF
                </span>
              </>
            )}
          </div>

          {product.productConfig?.attributes?.length > 0 && (
  <div className="space-y-4">
    {product.productConfig.attributes.map(attr => (
      <div key={attr.code}>
        <p className="text-sm font-medium mb-2">
          {attr.name}
        </p>

        <div className="flex gap-2 flex-wrap">
          {attr.values.map(value => {
            const active = selectedAttributes[attr.code] === value

            return (
              <button
                key={value}
                onClick={() =>
                  setSelectedAttributes(prev => ({
                    ...prev,
                    [attr.code]: value
                  }))
                }
                className={`px-4 py-2 rounded border text-sm ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-gray-300"
                }`}
              >
                {value}
              </button>
            )
          })}
        </div>
      </div>
    ))}
  </div>
)}

{selectedVariant && (
  <p className="text-sm text-gray-600">
    {selectedVariant.stockQuantity > 0
      ? `${selectedVariant.stockQuantity} available`
      : "Out of stock"}
  </p>
)}


          {inventory.manageStock && (
            <p className="text-sm text-gray-500">
              {inventory.stockQuantity > 0
                ? `${inventory.stockQuantity} in stock`
                : "Out of stock"}
            </p>
          )}

          {!customization?.enabled && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Quantity</span>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e =>
                  setQuantity(Math.max(1, Number(e.target.value)))
                }
                className="w-20 border rounded px-3 py-2"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
           {customization?.enabled && (
  <div className="space-y-2">
    <button
      disabled={!isConfigSelected}
      onClick={() =>
        router.push(
          `/products/customize/${product.slug}?variant=${encodeURIComponent(
            JSON.stringify(selectedVariant.attributes)
          )}&type=${product.type}`
        )
      }
      className={`px-6 py-3 rounded-lg w-full ${
        isConfigSelected
          ? "bg-black text-white"
          : "bg-gray-300 cursor-not-allowed"
      }`}
    >
      Customize Now
    </button>

    {!isConfigSelected && (
      <p className="text-sm text-gray-500">
        Please select product options (color, size, etc.) to continue
      </p>
    )}

    {selectedVariant && selectedVariant.stockQuantity === 0 && (
      <p className="text-sm text-red-600">
        Selected variant is out of stock
      </p>
    )}
  </div>
)}


            {!customization?.enabled && (
              <>
                {!added ? (
                  <button
                    onClick={handleAddToCart}
                    className="px-6 py-3 border border-black rounded-lg"
                  >
                    Add to Cart
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/cart")}
                    className="px-6 py-3 border border-black rounded-lg bg-gray-100"
                  >
                    View Cart
                  </button>
                )}
              </>
            )}
          </div>

          {added && (
            <p className="text-sm text-green-600">
              ✓ Added to cart
            </p>
          )}

          {customization?.enabled && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="font-medium">Customization Available</p>
              <p className="text-sm text-gray-600">
                Config: {customization.printConfig.configName}
              </p>
              <p className="text-sm text-gray-600">
                Type: {customization.printConfig.configType}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Similar Products (unchanged) */}
      {similarProducts.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h2 className="text-2xl font-semibold mb-6">
            Similar Products
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map(item => (
              <div
                key={item._id}
                onClick={() =>
                  router.push(`/products/${item.slug}`)
                }
                className="border rounded-lg p-3 cursor-pointer hover:shadow"
              >
                <img
                  src={item.thumbnail}
                  className="w-full h-40 object-cover rounded-md"
                  alt={item.name}
                />
                <h3 className="mt-2 font-medium">{item.name}</h3>
                <p className="text-sm text-gray-600">
                  {item.pricing.currency}{" "}
                  {item.pricing.specialPrice}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={() => setPreviewOpen(false)}
        >
          <img
            src={activeImage}
            className="max-w-[90%] max-h-[90%] object-contain"
            alt=""
          />
          <button
            onClick={() => setPreviewOpen(false)}
            className="absolute top-6 right-6 text-white text-3xl"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}

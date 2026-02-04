"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getProductBySlug } from "@/services/product.service"
import { addToCart } from "@/lib/cart"
import sizeChart from "@/../public/images/sizeChart.jpg"
import Image from "next/image"

export default function ProductDetailPage() {
  const { slug } = useParams()
  const router = useRouter()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(null)
  const [selectedAttributes, setSelectedAttributes] = useState({})
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [showSizeChart, setShowSizeChart] = useState(false)

  useEffect(() => {
    if (!slug) return

    const fetchProduct = async () => {
      try {
        const res = await getProductBySlug(slug)
        if (!res?.success) return router.push("/404")

        setProduct(res.data)

        const main =
          res.data.images?.find(i => i.isMain)?.url ||
          res.data.thumbnail

        setActiveImage(main)
      } catch {
        router.push("/404")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug, router])

  useEffect(() => {
    if (!product?.productConfig?.variants) return

    const match = product.productConfig.variants.find(v =>
      Object.entries(selectedAttributes).every(
        ([k, val]) => v.attributes[k] === val
      )
    )

    setSelectedVariant(match || null)
  }, [selectedAttributes, product])

  if (loading) return <div className="p-10 text-center">Loading…</div>
  if (!product) return <div className="p-10 text-center">Not found</div>

  const { pricing, customization, inventory, productConfig } = product
  const price = pricing.specialPrice ?? pricing.basePrice

  const isVariantProduct = productConfig?.attributes?.length > 0
  const isCustom = customization?.enabled

  const isConfigSelected =
    !isVariantProduct ||
    (selectedVariant && selectedVariant.stockQuantity > 0)

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: pricing.currency || "USD"
  }).format(price)

  const formattedBasePrice = pricing.basePrice
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: pricing.currency || "USD"
      }).format(pricing.basePrice)
    : null

  const handleAddToCart = () => {
    addToCart({
      id: crypto.randomUUID(),
      productId: product._id,
      slug: product.slug,
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

  const isValueAvailable = (attrCode, value) => {
    if (!productConfig?.variants) return true

    return productConfig.variants.some(v =>
      v.attributes[attrCode] === value &&
      Object.entries(selectedAttributes).every(
        ([k, val]) =>
          k === attrCode || v.attributes[k] === val
      ) &&
      v.stockQuantity > 0
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* LEFT IMAGES */}
      <div>
        <img
          src={activeImage}
          className="w-full h-[460px] object-contain bg-gray-50 rounded-xl"
        />

        <div className="flex gap-3 mt-4">
          {product.images?.map(img => (
            <img
              key={img.publicId}
              src={img.url}
              onClick={() => setActiveImage(img.url)}
              className={`w-20 h-20 rounded-lg object-contain bg-gray-50 cursor-pointer border ${
                activeImage === img.url
                  ? "border-black"
                  : "border-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* RIGHT CONTENT */}
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <p className="text-gray-600 mt-2">{product.description}</p>
        </div>

        <div className="flex items-end gap-4">
          <span className="text-4xl font-bold">
            {formattedPrice}
          </span>

          {pricing.specialPrice && (
            <span className="line-through text-gray-400">
              {formattedBasePrice}
            </span>
          )}
        </div>

        {/* VARIANTS */}
        {productConfig?.attributes?.length > 0 && (
          <div className="space-y-6">
            {productConfig.attributes.map(attr => (
              <div key={attr.code}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{attr.name}</p>

                  {attr.code === "size" && (
                    <button
                      onClick={() => setShowSizeChart(true)}
                      className="text-sm underline text-gray-600 hover:text-black"
                      type="button"
                    >
                      Size Chart
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {attr.values.map(value => {
                    const active =
                      selectedAttributes[attr.code] === value
                    const available =
                      isValueAvailable(attr.code, value)

                    return (
                      <button
                        key={value}
                        disabled={!available}
                        onClick={() =>
                          setSelectedAttributes(p => ({
                            ...p,
                            [attr.code]: value
                          }))
                        }
                        className={`px-4 py-2 rounded-full border text-sm ${
                          active
                            ? "bg-black text-white border-black"
                            : available
                            ? "border-gray-300 hover:border-black"
                            : "border-gray-200 text-gray-400 cursor-not-allowed"
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
          <p
            className={`text-sm ${
              selectedVariant.stockQuantity > 0
                ? "text-gray-600"
                : "text-red-600"
            }`}
          >
            {selectedVariant.stockQuantity > 0
              ? `${selectedVariant.stockQuantity} available`
              : "Out of stock"}
          </p>
        )}

        {!isCustom && !isVariantProduct && inventory.manageStock && (
          <p className="text-sm text-gray-600">
            {inventory.stockQuantity > 0
              ? `${inventory.stockQuantity} in stock`
              : "Out of stock"}
          </p>
        )}

        {!isCustom && (
          <div className="flex items-center gap-4">
            <span className="font-medium text-sm">Quantity</span>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e =>
                setQuantity(Math.max(1, Number(e.target.value)))
              }
              className="w-24 border rounded-lg px-3 py-2"
            />
          </div>
        )}

        <div className="space-y-3">
          {isCustom ? (
            <button
              disabled={!isConfigSelected}
              onClick={() =>
                router.push(
                  `/products/customize/${product.slug}?variant=${encodeURIComponent(
                    JSON.stringify(selectedVariant?.attributes)
                  )}&type=${product.type}`
                )
              }
              className={`w-full py-4 rounded-xl text-lg ${
                isConfigSelected
                  ? "bg-black text-white"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Customize Now
            </button>
          ) : !added ? (
            <button
              disabled={isVariantProduct && !isConfigSelected}
              onClick={handleAddToCart}
              className="w-full py-4 rounded-xl border border-black text-lg"
            >
              Add to Cart
            </button>
          ) : (
            <button
              onClick={() => router.push("/cart")}
              className="w-full py-4 rounded-xl bg-gray-100 border"
            >
              View Cart
            </button>
          )}

          {added && (
            <p className="text-green-600 text-sm">
              ✓ Added to cart
            </p>
          )}
        </div>
      </div>

      {/* SIZE CHART MODAL */}
      {showSizeChart && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full p-4 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSizeChart(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">
              Size Chart
            </h2>

            <Image
              src={sizeChart}
              alt="Size Chart"
              className="w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}

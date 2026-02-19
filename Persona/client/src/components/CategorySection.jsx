import Image from "next/image"
import Link from "next/link"
import SkeletonProductCard from "./SkeletonProductCard"

export default function CategorySection({
  title,
  products = [],
  loading,
  columns = "grid-cols-3 sm:grid-cols-3 md:grid-cols-7 lg:grid-cols-9",
  rounded = true
}) {
  if (!loading && products.length === 0) {
    return null
  }

  const roundedClass = rounded ? "rounded-lg" : "rounded-none"

  return (
    <section className="lg:px-6 mt-12">
      {title && (
        <h2 className="text-2xl font-semibold mb-6">
          {title}
        </h2>
      )}

      <div className={`grid ${columns} gap-4`}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <SkeletonProductCard key={i} />
            ))
          :products.map(product => {
  const basePrice = product.pricing.basePrice
  const specialPrice = product.pricing.specialPrice

  const hasDiscount =
    specialPrice && specialPrice < basePrice

  return (
    <Link
      key={product._id}
      href={`/products/${product.slug}`}
      className={`bg-white ${roundedClass} border border-gray-200 overflow-hidden hover:shadow-lg transition`}
    >
      <div className={`relative aspect-square bg-gray-100 ${roundedClass}`}>
        <Image
          src={product.thumbnail}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium line-clamp-1">
          {product.name}
        </h3>

        <div className="mt-1 flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="font-semibold text-gray-600 text-xs lg:text-lg">
                £{specialPrice}
              </span>
              <span className=" text-gray-400 line-through text-xs lg:text-lg">
                £{basePrice}
              </span>
            </>
          ) : (
            <span className="font-semibold text-xs lg:text-xl">
              £{basePrice}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
})
}
      </div>
    </section>
  )
}

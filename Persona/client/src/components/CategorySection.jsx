import Image from "next/image"
import Link from "next/link"
import SkeletonProductCard from "./SkeletonProductCard"

export default function CategorySection({
  title,
  products = [],
  loading,
  columns = "grid-cols-2 sm:grid-cols-3 md:grid-cols-7 lg:grid-cols-9",
}) {
  if (!loading && products.length === 0) {
    return null
  }

  return (
    <section className="px-6 mt-12">
      <h2 className="text-2xl font-semibold mb-6">
        {title}
      </h2>

      <div className={`grid ${columns} gap-4`}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <SkeletonProductCard key={i} />
            ))
          : products.map(product => {
              const price =
                product.pricing.specialPrice ??
                product.pricing.basePrice

              return (
                <Link
                  key={product._id}
                  href={`/products/${product.slug}`}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition"
                >
                  <div className="relative aspect-square bg-gray-100">
                    <Image
                      src={product.thumbnail}
                      alt={product.name}
                      fill
                      className="object-cover "
                      
                    />
                  </div>

                  <div className="p-3">
                    <h3 className="text-sm font-medium line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="font-semibold mt-1">
                      £{price}
                    </p>
                  </div>
                </Link>
              )
            })}
      </div>
    </section>
  )
}

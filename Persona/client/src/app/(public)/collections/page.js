"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAllProducts } from "@/services/product.service"
import ProductCard from "@/components/product/ProductCard"
import Skeleton from "@/components/ui/Skeleton"
import { ChevronRight } from "lucide-react"
import Footer from "@/components/common/Footer"

export default function CollectionsPage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts({ limit: 100 })
        setProducts(Array.isArray(data?.products) ? data.products : [])
      } catch (e) {
        console.error("Failed to fetch products:", e.message)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Unique Categories
  const categories = Array.from(
    new Map(
      products.map(p => [
        p.itemType,
        {
          title: p.itemType,
          image: p.images?.[0],
          productCount: products.filter(prod => prod.itemType === p.itemType).length
        }
      ])
    ).values()
  )

  // Group products by itemType
  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.itemType]) {
      acc[product.itemType] = []
    }
    acc[product.itemType].push(product)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 md:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Personalised Gifts & Prints
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100">
            Your Moments, Perfectly Personalised
          </p>
          <p className="text-lg text-indigo-200 max-w-2xl mx-auto">
            Discover unique, customisable gifts for every occasion.
            Make every moment memorable.
          </p>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Select by Category
            </h2>
            <p className="text-gray-600 mt-2">
              Find the perfect gift for every occasion
            </p>
          </div>
          <button
           
            className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View all
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))
          ) : categories.map(category => (
            <div
              key={category.title}
              onClick={() => router.push(`/products?category=${category.title}`)}
              className="group cursor-pointer"
            >
              <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-bold capitalize">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-200 mt-1">
                    {category.productCount} items
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* All Gift Collections By Type */}
      <section className="max-w-7xl mx-auto px-6 py-16 space-y-20">

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : Object.entries(groupedProducts).map(([type, items]) => (
          <div key={type} className="space-y-8">

            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 capitalize">
                  {type === "normal" ? "Gift Collection" : type}
                </h2>
                <p className="text-gray-600 mt-2">
                  Explore our premium {type} designs
                </p>
              </div>

              <button
                onClick={() => router.push(`/products?category=${type}`)}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onClick={() => router.push(`/products/${product._id}`)}
                  className="transform hover:-translate-y-1 transition-transform duration-200"
                />
              ))}
            </div>

          </div>
        ))}

      </section>

      <Footer />
    </div>
  )
}

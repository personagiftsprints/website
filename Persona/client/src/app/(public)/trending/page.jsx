"use client"

import { useEffect, useState } from "react"
import CategorySection from "@/components/CategorySection"
import { TrendingProducts } from "@/services/product.service"
import { ShieldCheck, Smile, Gift, Truck } from "lucide-react"

const Page = () => {
  const [productsData, setProductsData] = useState(null)
  const isLoading = !productsData

  useEffect(() => {
    TrendingProducts()
      .then(data => {
        setProductsData(data)
      })
      .catch(err => {
        console.error("Trending products error", err)
      })
  }, [])

  return (
    <div className="lg:px-32 px-5 py-8 space-y-24">

      {/* 🔥 Trending Hero Section */}
      <div className="text-center space-y-5">
        <span className="text-xs uppercase tracking-widest text-orange-500 font-semibold">
          Community Favorites
        </span>

        <h2 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
          🔥 Most Loved Gifts
        </h2>

        <p className="text-gray-500 max-w-xl mx-auto">
          Trending picks our customers can’t stop buying. 
          Fresh drops. Viral designs. Limited stock.
        </p>

        <div className="w-24 h-1 bg-orange-500 mx-auto rounded-full"></div>
      </div>

      <CategorySection
        title=""
        products={productsData?.trending || []}
        loading={isLoading}
        rounded={false}
      />

      {/* 💎 Trust / Highlight Banner Section */}
      <div className="bg-gradient-to-r from-orange-100 to-yellow-50 rounded-3xl p-8 lg:p-14 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">

          <div className="flex flex-col items-center space-y-3">
            <ShieldCheck className="h-10 w-10 text-orange-500" />
            <h3 className="font-semibold text-lg">Premium Quality</h3>
            <p className="text-sm text-gray-600">
              High-quality materials. Built to last.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-3">
            <Smile className="h-10 w-10 text-orange-500" />
            <h3 className="font-semibold text-lg">Happy Customers</h3>
            <p className="text-sm text-gray-600">
              Thousands of satisfied buyers across UK.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-3">
            <Gift className="h-10 w-10 text-orange-500" />
            <h3 className="font-semibold text-lg">Perfect Gifts</h3>
            <p className="text-sm text-gray-600">
              Ideal presents for every occasion.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-3">
            <Truck className="h-10 w-10 text-orange-500" />
            <h3 className="font-semibold text-lg">Fast Delivery</h3>
            <p className="text-sm text-gray-600">
              Quick shipping with secure packaging.
            </p>
          </div>

        </div>
      </div>

      {/* 👕 T-Shirt Section */}
      <div className="text-center space-y-5">
        <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
          Style That Speaks
        </span>

        <h2 className="text-3xl md:text-4xl font-bold">
          Trending T-Shirt Collections
        </h2>

        <div className="w-20 h-1 bg-black mx-auto rounded-full"></div>
      </div>

      <CategorySection
        title=""
        products={productsData?.tshirts || []}
        loading={isLoading}
      />

    </div>
  )
}

export default Page

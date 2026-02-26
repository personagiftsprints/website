"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Navbar from "@/components/common/Navbar"
import Footer from "@/components/common/Footer"
import CategorySection from "@/components/CategorySection"
import { searchProducts } from "@/services/product.service"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const type = searchParams.get("type") || ""

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)



  useEffect(() => {
    if (!query && !type) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    searchProducts(query, type)
      .then((res) => {
        setProducts(res.data || [])
        setPagination(res.pagination)
      })
      .catch((err) => {
        console.error("Search error:", err)
        setProducts([])
      })
      .finally(() => setLoading(false))
  }, [query, type])

  return (
    <div className="w-full min-h-screen flex flex-col bg-white">
   

      <div className="lg:px-32 px-4 pt-10 pb-20 flex-1">
        <h1 className="text-2xl font-bold mb-2">
          Search results for "{query}"
        </h1>
        {!loading && (
          <p className="text-gray-500 mb-6">
            {products.length} product{products.length !== 1 ? "s" : ""} found
          </p>
        )}

        {!loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-400 text-lg">No products found</p>
            <p className="text-gray-400 text-sm mt-2">
              Try a different search term
            </p>
          </div>
        ) : (
          <CategorySection
            title=""
            products={products}
            loading={loading}
            columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          />
        )}
      </div>

    </div>
  )
}
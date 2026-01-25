"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Navbar from "@/components/common/Navbar"
import CardBlockSection from "@/components/sections/CardBlockSection"
import Footer from "@/components/common/Footer"
import Link from "next/link"
import { Gift } from "lucide-react"
import { getBanner } from "@/services/home-content.service"
import { motion, useAnimation } from "framer-motion"
import DefaultBanner from "@/../public/images/banner.jpg"

export default function Home() {
  const [bannerUrl, setBannerUrl] = useState(null)
  const controls = useAnimation()

  const trendingProducts = [
    {
      id: 1,
      title: "Minimal Black T-Shirt",
      price: 699,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    },
    {
      id: 2,
      title: "Custom Photo Mug",
      price: 399,
      image: "https://images.unsplash.com/photo-1511920170033-f8396924c348",
    },
    {
      id: 3,
      title: "Matte Phone Case",
      price: 499,
      image: "https://images.unsplash.com/photo-1580910051074-7f4d1d3c6f7c",
    },
    {
      id: 4,
      title: "Gift Combo Box",
      price: 999,
      image: "https://images.unsplash.com/photo-1607082349566-1870e0f44c37",
    },
  ]

  useEffect(() => {
    getBanner()
      .then(data => {
        if (data?.homeBanner?.imageUrl) {
          setBannerUrl(data.homeBanner.imageUrl)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      controls.start({
        rotate: [0, -12, 12, -12, 12, 0],
        transition: { duration: 0.6 },
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [controls])

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="w-full relative h-[20vh] lg:h-[50vh] lg:px-6 px-[2px] pt-6">
        {bannerUrl ? (
          <div className="relative w-full h-full overflow-hidden lg:rounded-3xl rounded-2xl">
            <Image
              src={bannerUrl}
              alt="Persona Banner"
              fill
              priority
              className="object-cover"
            />
          </div>
        ) : (
          
          <div className="relative w-full h-full overflow-hidden lg:rounded-3xl rounded-2xl">
            <Image
              src={DefaultBanner}
              alt="Persona Banner"
              fill
              priority
              className="object-cover"
            />
          </div>
        )}
      </main>

      <CardBlockSection
        heading="Featured Collections"
        items={[
          {
            title: "T-Shirts",
            image: "https://thebridgestore.in/cdn/shop/files/JColeFront.jpg",
            type: "tshirt",
          },
          {
            title: "Mugs",
            image:
              "https://static-assets-prod.fnp.com/images/pr/m/v300/personalised-couple-magic-mug.jpg",
            type: "mug",
          },
          {
            title: "Phone Cases",
            image: "https://m.media-amazon.com/images/I/71z8bQorkML.jpg",
            type: "case",
          },
          {
            title: "Gifts",
            image:
              "https://images.pexels.com/photos/264787/pexels-photo-264787.jpeg",
            type: "gift",
          },
        ]}
      />

      <section className="w-full px-4 lg:px-16 py-14 bg-white">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-black">
            Trending Products
          </h2>
          <Link
            href="/products"
            className="text-sm font-semibold text-red-600 hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {trendingProducts.map(product => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group"
            >
              <motion.div
                whileHover={{ y: -6 }}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden"
              >
                <div className="relative w-full h-48">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition"
                  />
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="mt-1 text-lg font-bold text-red-600">
                    ${product.price}
                  </p>

                  <button className="mt-3 w-full rounded-xl bg-black py-2 text-sm font-semibold text-white hover:bg-gray-800 active:scale-[0.98] transition">
                    View Product
                  </button>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />

      <motion.div animate={controls} className="fixed bottom-6 right-6">
        <Link
          href="/products"
          aria-label="Browse products"
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-400 shadow-xl"
        >
          <Gift className="h-8 w-8 text-black" strokeWidth={2.5} />
        </Link>
      </motion.div>
    </div>
  )
}

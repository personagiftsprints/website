"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Navbar from "@/components/common/Navbar"
import CardBlockSection from "@/components/sections/CardBlockSection"
import Footer from "@/components/common/Footer"
import Link from "next/link"
import { Gift,Instagram  } from "lucide-react"
import { getBanner } from "@/services/home-content.service"
import { motion, useAnimation } from "framer-motion"
import DefaultBanner from "@/assets/images/banner.jpg"
import { TrendingProducts } from "@/services/product.service"
import CategorySection from "@/components/CategorySection"

function FloatingSocials() {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2  bottom-6 z-40 flex flex-col gap-3">
      {/* Instagram */}
      <a
        href="https://www.instagram.com/yourpage"
        target="_blank"
        rel="noopener noreferrer"
        className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white shadow-lg hover:scale-110 transition-transform"
        aria-label="Instagram"
      >
        <Instagram size={20} />
      </a>

      {/* WhatsApp */}
      <a
        href="https://wa.me/yourphonenumber"
        target="_blank"
        rel="noopener noreferrer"
        className="w-11 h-11 flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  )
}

export default function Home() {
  const [bannerUrl, setBannerUrl] = useState(null)
  const controls = useAnimation()
const [trendingProductsData, setTrendingProducts] = useState([])
const [productsData, setProductsData] = useState(null)
const isLoading = !productsData


  useEffect(() => {
  TrendingProducts()
    .then(data => {
      console.log(data)
      setProductsData(data)

     
    })
    .catch(err => {
      console.error("Trending products error", err)
    })
}, [])


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
    <div className="w-full min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="w-full relative h-[20vh] lg:h-[60vh] lg:px-6 px-[2px] pt-6">
        {bannerUrl ? (
          <div className="relative w-full h-full overflow-hidden lg:rounded-3xl ">
            <Image
              src={bannerUrl}
              alt="Persona Banner"
              fill
              priority
              className="object-cover"
            />
          </div>
        ) : (
          
          <div className="relative w-full h-full overflow-hidden lg:rounded-3xl">
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
        heading="FEATURED COLLECTIONS"
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
            type: "mobileCase",
          },
          {
            title: "Gifts",
            image:
              "https://images.pexels.com/photos/264787/pexels-photo-264787.jpeg",
            type: "normal",
          },
        ]}
      />


<div className="lg:px-32 pb-20">
    <CategorySection
  title="TRENDING PRODUCTS"
  products={productsData?.trending || []}
  loading={isLoading}
/>

<CategorySection
  title="TSHIRTS"
  products={productsData?.tshirts || []}
  loading={isLoading}
  columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
/>

<CategorySection
  title="MUGS"
  products={productsData?.mugs || []}
  loading={isLoading}
  columns="grid-cols-2 sm:grid-cols-4 lg:grid-cols-4"
/>




<CategorySection
  title="MOBILE COVER"
  products={productsData?.mobileCase || []}
  loading={isLoading}
  columns="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
/>


<CategorySection
  title="NORMAL"
  products={productsData?.normal || []}
  loading={isLoading}
  columns="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
/>






</div>
   <FloatingSocials />

      <Footer />

      {/* <motion.div animate={controls} className="fixed bottom-6 right-6">
        <Link
          href="/products"
          aria-label="Browse products"
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-400 shadow-xl"
        >
          <Gift className="h-8 w-8 text-black" strokeWidth={2.5} />
        </Link>
      </motion.div> */}
    </div>
  )
}

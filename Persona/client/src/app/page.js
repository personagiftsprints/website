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
import DefaultBanner from "@/assets/images/banner.jpg"
import { TrendingProducts } from "@/services/product.service"
import CategorySection from "@/components/CategorySection"


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
  title="Trending Products"
  products={productsData?.trending || []}
  loading={isLoading}
/>

<CategorySection
  title="T-Shirts"
  products={productsData?.tshirts || []}
  loading={isLoading}
  columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
/>

<CategorySection
  title="Mugs"
  products={productsData?.mugs || []}
  loading={isLoading}
  columns="grid-cols-2 sm:grid-cols-4 lg:grid-cols-4"
/>




<CategorySection
  title="Mobile cover"
  products={productsData?.mobileCase || []}
  loading={isLoading}
  columns="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
/>


<CategorySection
  title="Normal"
  products={productsData?.normal || []}
  loading={isLoading}
  columns="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
/>






</div>
 

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

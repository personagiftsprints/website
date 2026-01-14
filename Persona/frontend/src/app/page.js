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

export default function Home() {
  const [bannerUrl, setBannerUrl] = useState(null)
  const controls = useAnimation()

  useEffect(() => {
    getBanner()
      .then((data) => {
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
        transition: { duration: 0.6 }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [controls])

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#d01f1f]">
      <Navbar />

      <main className="w-full relative h-[20vh] lg:h-[50vh]">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt="Persona Banner"
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
            Loading banner...
          </div>
        )}
      </main>

      <CardBlockSection
        heading="Featured Collections"
        items={[
          {
            title: "T-Shirts",
            image: "https://thebridgestore.in/cdn/shop/files/JColeFront.jpg"
          },
          {
            title: "Mugs",
            image:
              "https://static-assets-prod.fnp.com/images/pr/m/v300/personalised-couple-magic-mug.jpg"
          },
          {
            title: "Phone Cases",
            image: "https://m.media-amazon.com/images/I/71z8bQorkML.jpg"
          },
          {
            title: "Gifts",
            image:
              "https://images.pexels.com/photos/264787/pexels-photo-264787.jpeg"
          }
        ]}
      />

      <Footer />

      <motion.div
        animate={controls}
        className="fixed bottom-6 right-6"
      >
        
        <Link
          href="/products"
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-400 shadow-xl"
        >
          <Gift className="h-8 w-8 text-black" strokeWidth={2.5} />
        </Link>
      </motion.div>


    </div>
  )
}

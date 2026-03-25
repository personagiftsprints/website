"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Navbar from "@/components/common/Navbar"
import CardBlockSection from "@/components/sections/CardBlockSection"
import Footer from "@/components/common/Footer"
import Link from "next/link"
import { Gift, Instagram } from "lucide-react"
import { getBanner } from "@/services/home-content.service"
import { motion, useAnimation } from "framer-motion"
import DefaultBanner from "@/assets/images/banner.jpg"
import { TrendingProducts } from "@/services/product.service"
import CategorySection from "@/components/CategorySection"


export default function Home() {
  const [banners, setBanners] = useState([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const controls = useAnimation()
  const [trendingProductsData, setTrendingProducts] = useState([])
  const [productsData, setProductsData] = useState(null)
  const isLoading = !productsData


  useEffect(() => {
    TrendingProducts()
      .then(data => {
        // console.log(data)
        setProductsData(data)


      })
      .catch(err => {
        console.error("Trending products error", err)
      })
  }, [])


  useEffect(() => {
    getBanner()
      .then(data => {
        let items = [];
        if (data?.homeBanners) items = data.homeBanners;
        else if (data?.data?.homeBanners) items = data.data.homeBanners;
        else if (data?.homeBanner?.imageUrl) items = [data.homeBanner];
        else if (data?.data?.homeBanner?.imageUrl) items = [data.data.homeBanner];

        if (items && items.length > 0) {
          setBanners(items);
        }
      })
      .catch(() => { })
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length)
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length])

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

      <main className="w-full relative h-[20vh] lg:h-[60vh] lg:px-6 px-[2px] pt-6 group">
        {banners.length > 0 ? (
          <div className="relative w-full h-full overflow-hidden lg:rounded-3xl">
            {banners.map((banner, index) => (
              <div
                key={banner._id || index}
                className={`absolute inset-0 transition-opacity duration-1000 ${index === currentBannerIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
              >
                <Image
                  src={banner.imageUrl}
                  alt={`Persona Banner ${index + 1}`}
                  fill
                  priority={index === 0}
                  className="object-cover"
                />
              </div>
            ))}

            {/* Pagination Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-20">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentBannerIndex ? "bg-white w-8 " : "bg-white/50 hover:bg-white/80"
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
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
            image: "https://printo.in/blog/wp-content/uploads/2021/11/Custom-T-Shirt-Printing.jpg",
            type: "tshirt",
          },
          {
            title: "Mugs",
            image:
              "https://static-assets-prod.fnp.com/images/pr/m/v300/personalised-couple-magic-mug.jpg",
            type: "mug",
          },
          {
            title: "Photo slate",
            image: "https://www.pictureperfect.co.uk/cdn/shop/files/il_fullxfull.4347291441_ebo7_grande.jpg",
            type: "photoslate",
          },
          {
            title: "Key chain",
            image:
              "https://res.cloudinary.com/dx9rxauty/image/upload/v1773745664/products/f8smnkpsbyl6n6eazdbk.webp",
            type: "keychain",
          },
        ]}
      />


      <div className="lg:px-32 pb-20 px-2">
        <CategorySection
          title="TRENDING PRODUCTS"
          products={productsData?.trending || []}
          loading={isLoading}
        />

        {productsData?.subcategories?.map((sub) => (
          <CategorySection
            key={sub._id}
            title={sub.name.toUpperCase()}
            products={sub.products || []}
            loading={isLoading}
            columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          />
        ))}
      </div>

      <Footer />


    </div>
  )
}

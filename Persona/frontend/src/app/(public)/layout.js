"use client"


import Footer from "@/components/common/Footer"
import Navbar from "@/components/common/Navbar"

export default function PublicLayout({ children }) {



  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {children}
      </main>

      <Footer />

   
    </div>
  )
}

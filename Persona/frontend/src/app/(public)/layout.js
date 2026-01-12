"use client"

import Footer from "@/components/common/Footer"
import Navbar from "@/components/common/Navbar"
import { Gift } from "lucide-react"
import Link from "next/link"

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {children}
      </main>

      <Footer/>

    
    </div>
  )
}

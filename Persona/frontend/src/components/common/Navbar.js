"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { montserratBold } from "@/lib/fonts"
import { ShoppingCart } from "lucide-react"
import { getBanner } from "@/services/home-content.service"

const messages = [
  { id: 1, content: "Christmas offer is now available 🎁", link: null },
  { id: 2, content: "Shop Now →", link: "/products" },
  { id: 3, content: "Limited-time festive discounts 🎄", link: null },
]


function OfferBanner() {
  const [messages, setMessages] = useState([])
  const [enabled, setEnabled] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBanner()
        console.log(data)
        if (data?.discountBanner?.enabled) {
          setEnabled(true)
          setMessages(
            (data.discountBanner.messages || []).map((msg, i) => ({
              id: i,
              content: msg,
              link: null
            }))
          )
        }
      } catch {}
    }

    load()
  }, [])

  useEffect(() => {
    if (!enabled || messages.length === 0) return
    const timer = setInterval(
      () => setIndex((p) => (p + 1) % messages.length),
      4000
    )
    return () => clearInterval(timer)
  }, [enabled, messages])

  if (!enabled || messages.length === 0) return null

  return (
    <div className="w-full bg-[#d01f1f] text-xs text-white py-1 overflow-hidden">
      <div className="relative h-5 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={messages[index].id}
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "-120%" }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute whitespace-nowrap font-medium"
          >
            {messages[index].link ? (
              <Link href={messages[index].link} className="underline font-semibold">
                {messages[index].content}
              </Link>
            ) : (
              messages[index].content
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}


export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white">
      <OfferBanner />

      {/* MAIN NAVBAR */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">

          {/* Desktop Nav */}
          <nav className="hidden lg:flex gap-8 text-sm text-gray-700">
            <Link href="/" className="hover:text-black">Home</Link>
            <Link href="/trending" className="hover:text-black">Trending</Link>
            <Link href="/about" className="hover:text-black">About</Link>
            <Link href="/contact" className="hover:text-black">Contact</Link>
            <Link href="/collection" className="hover:text-black">Collection</Link>
          </nav>

          {/* Logo */}
          <Link
            href="/"
            className={`${montserratBold.className} text-2xl sm:text-3xl font-extrabold tracking-wide text-orange-500`}
          >
            PERSONA
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-3">

            {/* Desktop Search */}
            <div className="hidden lg:block relative">
              <input
                placeholder="Search"
                className="w-72 h-10 rounded-md border pl-10 pr-3 text-sm focus:outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                ⌕
              </span>
            </div>

            {/* Cart + Profile */}
            <div className="flex items-center gap-3">
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-medium flex items-center justify-center">
                  2
                </span>
              </Link>

              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <span className="hidden sm:block text-sm text-gray-700">Ezra</span>
                <Image
                  src="https://img.freepik.com/free-photo/front-view-business-woman-suit_23-2148603018.jpg"
                  alt="User"
                  width={30}
                  height={30}
                  className="rounded-full object-cover sm:w-[34px] sm:h-[34px]"
                />
              </Link>
            </div>

            {/* Menu Button */}
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE SEARCH (ONLY MOBILE) */}
      <div className="block lg:hidden   px-4 py-3 bg-white">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products"
            className="w-full h-10 rounded-md border border-amber-400 pl-10 pr-3 text-sm focus:outline-none"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            ⌕
          </span>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-xl"
            >
              <div className="p-6 flex items-center justify-between border-b">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setOpen(false)}>✕</button>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <Link href="/" onClick={() => setOpen(false)} className="block">Home</Link>
                <Link href="/trending" onClick={() => setOpen(false)} className="block">Trending</Link>
                <Link href="/about" onClick={() => setOpen(false)} className="block">About</Link>
                <Link href="/contact" onClick={() => setOpen(false)} className="block">Contact</Link>
                <Link href="/collection" onClick={() => setOpen(false)} className="block">Collection</Link>

                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Cart
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}

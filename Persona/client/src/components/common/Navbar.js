"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { montserratBold } from "@/lib/fonts"
import { ShoppingCart, ChevronDown, ShieldCheck, Mail, Search, X } from "lucide-react"
import { getBanner } from "@/services/home-content.service"
import Logo from "@/assets/icons/logo.png"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import cartManager from "@/lib/cart"


function OfferBanner() {
  const [messages, setMessages] = useState([])
  const [enabled, setEnabled] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBanner()
        if (data?.discountBanner?.enabled) {
          setEnabled(true)
          setMessages(
            (data.discountBanner.messages || []).map((msg, i) => ({
              id: i,
              content: msg
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
      () => setIndex(p => (p + 1) % messages.length),
      4000
    )
    return () => clearInterval(timer)
  }, [enabled, messages])

  if (!enabled || messages.length === 0) return null

  return (
    <div className="w-full bg-orange-400 text-xs py-1">
      <div className="h-5 flex items-center justify-center font-medium">
        {messages[index].content}
      </div>
    </div>
  )
}

function UserMenuDesktop() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [])

  if (!user) {
    return (
      <button
        onClick={() => window.dispatchEvent(new Event("open-auth"))}
        className="hidden lg:flex items-center gap-1.5 text-sm font-medium text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100"
      >
        Hi, Guest <ChevronDown size={14} />
      </button>
    )
  }

  const isAdmin = user.role === "admin" || user.isAdmin === true

  return (
    <div className="relative hidden lg:block">
      <button
        onClick={e => {
          e.stopPropagation()
          setOpen(o => !o)
        }}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100"
      >
        Hi, {user.firstName} <ChevronDown size={14} />
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        >
          <Link href="/account" className="block px-4 py-2.5 text-sm hover:bg-gray-50">
            My Account
          </Link>

          <Link href="/order" className="block px-4 py-2.5 text-sm hover:bg-gray-50">
            My Orders
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-gray-50"
            >
              <ShieldCheck size={16} />
              Admin Panel
            </Link>
          )}

          <button
            onClick={() => {
              logout()
              setOpen(false)
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef(null)
  const router = useRouter()

  // Auto-focus input when search overlay opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 200)
    }
  }, [searchOpen])

  // Close search on Escape key & lock body scroll
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setSearchOpen(false)
    }
    if (searchOpen) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleEsc)
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleEsc)
    }
  }, [searchOpen])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery("")
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white">
        <OfferBanner />

        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <nav className="hidden lg:flex gap-8 text-sm text-gray-700">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/collections">Collection</Link>
            <Link href="/trending">Trending</Link>
          </nav>

          <Link
            href="/"
            className={`${montserratBold.className} flex items-center gap-2 text-2xl sm:text-3xl font-extrabold text-[#f9a51b]`}
          >
            <Image src={Logo} alt="Persona Logo" width={40} height={40} />
            PERSONA
          </Link>

          <div className="flex items-center gap-3">

            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 text-[14px] text-gray-700 hover:text-black transition"
              aria-label="Open search"
            >
              <Search size={18} />
            </button>

            {/* Contact Us */}
            <a
              href="mailto:info@persona.co.uk?subject=Customer%20Enquiry"
              className="hidden lg:flex items-center gap-1.5 text-[14px] text-gray-700 hover:text-black"
            >
             
              Contact Us
            </a>

            <Link
              href="/cart"
              className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <UserMenuDesktop />

            <button
              onClick={() => setOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* ── Full-Screen Search Overlay (slides from top) ── */}
      <div
        className={`fixed inset-0 z-[100] transition-all duration-300 ease-in-out ${
          searchOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => {
            setSearchOpen(false)
            setSearchQuery("")
          }}
          className="absolute inset-0 bg-black/50 "
        />

        {/* Search Panel */}
        <div
          className={`relative w-full bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            searchOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="max-w-3xl mx-auto px-5 py-8">
            {/* Header row */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Search
              </p>
              <button
                onClick={() => {
                  setSearchOpen(false)
                  setSearchQuery("")
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-3 border-b-2 border-gray-900 pb-3">
                <Search size={22} className="text-gray-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, categories..."
                  className="flex-1 bg-transparent text-lg text-gray-900 placeholder-gray-400 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between mt-5">
                <p className="text-xs text-gray-400">
                  Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 text-[11px] font-mono">ESC</kbd> to close
                </p>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:opacity-90 transition"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── Mobile Sidebar ── */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/40 z-40"
          />

          <aside className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl">
            <div className="h-full flex flex-col bg-white">

              {/* Profile Header */}
              <div className="px-6 py-6 border-b bg-gradient-to-r from-gray-50 to-white">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  {user ? "Welcome back" : "Welcome"}
                </p>
                <p className="text-xl font-semibold text-gray-900 mt-1">
                  {user ? user.firstName : "Guest"}
                </p>
                {!user && (
                  <button
                    onClick={() => {
                      setOpen(false)
                      window.dispatchEvent(new Event("open-auth"))
                    }}
                    className="mt-5 w-full py-3 rounded-xl bg-black text-white text-sm font-medium hover:opacity-90 transition"
                  >
                    Sign In / Create Account
                  </button>
                )}
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                <Link href="/" onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition">
                  Home
                </Link>
                <Link href="/collections" onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition">
                  Collections
                </Link>
                <Link href="/trending" onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition">
                  Trending
                </Link>
                <Link href="/order" onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition">
                  Orders
                </Link>
                <Link href="/cart" onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition">
                  Cart
                </Link>
              </nav>

              {/* Footer Area */}
              <div className="px-6 py-5 border-t bg-gray-50 space-y-4">
                {user && (
                  <button
                    onClick={() => { logout(); setOpen(false) }}
                    className="w-full py-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition"
                  >
                    Logout
                  </button>
                )}
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Persona Gifts & Prints<br />
                  Secure shopping experience
                </p>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
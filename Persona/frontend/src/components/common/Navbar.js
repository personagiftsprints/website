"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { montserratBold } from "@/lib/fonts"
import { ShoppingCart, ChevronDown } from "lucide-react"
import { getBanner } from "@/services/home-content.service"
import Logo from "@/../public/icons/logo.png"
import { useAuth } from "@/context/AuthContext"
import { getCartCount } from "@/lib/cart"

/* ---------------- OFFER BANNER ---------------- */

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

/* ---------------- DESKTOP USER MENU ---------------- */

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
          className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50"
        >
          <Link href="/account" className="block px-4 py-2.5 text-sm hover:bg-gray-50">
            My Account
          </Link>

          <Link href="/orders" className="block px-4 py-2.5 text-sm hover:bg-gray-50">
            My Orders
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="block px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-gray-50"
            >
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

/* ---------------- NAVBAR ---------------- */

export default function Navbar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const updateCount = () => setCartCount(getCartCount())

    updateCount()
    window.addEventListener("cart-updated", updateCount)
    window.addEventListener("storage", updateCount)

    return () => {
      window.removeEventListener("cart-updated", updateCount)
      window.removeEventListener("storage", updateCount)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white">
      <OfferBanner />

      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <nav className="hidden lg:flex gap-8 text-sm text-gray-700">
          <Link href="/">Home</Link>
          <Link href="/trending">Trending</Link>
          <Link href="/about">About</Link>
          <Link href="/collections">Collection</Link>
        </nav>

        <Link
          href="/"
          className={`${montserratBold.className} flex items-center gap-2 text-2xl sm:text-3xl font-extrabold text-[#f9a51b]`}
        >
          <Image src={Logo} alt="Persona Logo" width={40} height={40} />
          PERSONA
        </Link>

        <div className="flex items-center gap-3">
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

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/40 z-40"
          />

          <aside className="fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-xl">
            <div className="p-6 space-y-6">

              {/* MOBILE USER SECTION */}
              <div className="border-b pb-4">
                <p className="text-sm text-gray-500">
                  {user ? `Hi, ${user.firstName}` : "Hi, Guest"}
                </p>

                {!user && (
                  <button
                    onClick={() => {
                      setOpen(false)
                      window.dispatchEvent(new Event("open-auth"))
                    }}
                    className="mt-2 text-sm text-blue-600"
                  >
                    Login
                  </button>
                )}

                {user && (
                  <button
                    onClick={() => {
                      logout()
                      setOpen(false)
                    }}
                    className="mt-2 text-sm text-red-600"
                  >
                    Logout
                  </button>
                )}
              </div>

              {/* MOBILE NAV LINKS */}
              <Link href="/" onClick={() => setOpen(false)}>Home</Link>
              <Link href="/collections" onClick={() => setOpen(false)}>Collection</Link>
              <Link href="/orders" onClick={() => setOpen(false)}>Orders</Link>
              <Link href="/cart" onClick={() => setOpen(false)}>Cart</Link>
            </div>
          </aside>
        </>
      )}
    </header>
  )
}

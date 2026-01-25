"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { User, MapPin, Home } from "lucide-react"

export default function AccountLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user === null) router.replace("/")
  }, [user, router])

  if (!user) return null

  const firstLetter = user.firstName?.[0]?.toUpperCase() || "U"

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:p-6 grid grid-cols-12 gap-4 md:gap-6">
      <aside className="col-span-12 md:col-span-3">
        <div className="bg-white rounded-xl border p-4 md:p-5 space-y-4 md:space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 md:h-12 md:w-12 rounded-full bg-black text-white flex items-center justify-center text-lg md:text-xl font-semibold">
              {firstLetter}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs md:text-sm text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
            <Link
              href="/account"
              className={`flex items-center gap-3 text-center md:text-left px-4 py-3 rounded-lg text-sm md:text-base whitespace-nowrap transition-colors ${
                pathname === "/account"
                  ? "bg-black text-white"
                  : "bg-gray-100 md:bg-transparent md:hover:bg-gray-100"
              }`}
            >
              <User size={18} />
              <span>My Account</span>
            </Link>

            <Link
              href="/account/address"
              className={`flex items-center gap-3 text-center md:text-left px-4 py-3 rounded-lg text-sm md:text-base whitespace-nowrap transition-colors ${
                pathname === "/account/address"
                  ? "bg-black text-white"
                  : "bg-gray-100 md:bg-transparent md:hover:bg-gray-100"
              }`}
            >
              <MapPin size={18} />
              <span>Addresses</span>
            </Link>
          </nav>
        </div>
      </aside>

      <main className="col-span-12 md:col-span-9">
        {children}
      </main>
    </div>
  )
}
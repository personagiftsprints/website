"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Package,
  Ticket,
  Image as ImageIcon,
  Users,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  Printer,
} from "lucide-react"

function NavItem({ href, icon: Icon, label, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100"
    >
      <Icon size={18} className="text-gray-600" />
      <span>{label}</span>
    </Link>
  )
}

function SidebarContent({ onItemClick }) {
  return (
    <>
      <div className="p-6 text-xl font-bold">Persona Admin</div>

      <nav className="px-4 text-sm flex-1 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">
            Overview
          </p>
          <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard" onClick={onItemClick} />
          <NavItem href="/admin/reports" icon={BarChart3} label="Analytics & Reports" onClick={onItemClick} />
        </div>

        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">
            Commerce
          </p>
          <NavItem href="/admin/orders" icon={ShoppingBag} label="Orders" onClick={onItemClick} />
          <NavItem href="/admin/products" icon={Package} label="Products" onClick={onItemClick} />
          <NavItem href="/admin/print-config" icon={Printer} label="Print Config" onClick={onItemClick} />
          <NavItem href="/admin/coupons" icon={Ticket} label="Coupons & Discounts" onClick={onItemClick} />
          <NavItem href="/admin/transactions" icon={Ticket} label="Transactions" onClick={onItemClick} />
        </div>

        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">
            Content
          </p>
          <NavItem href="/admin/banners" icon={ImageIcon} label="Homepage Banners" onClick={onItemClick} />
        </div>

        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">
            Administration
          </p>
          <NavItem href="/admin/users" icon={Users} label="Customers" onClick={onItemClick} />
          <NavItem href="/admin/admin-access" icon={Shield} label="Admin Access" onClick={onItemClick} />
          <NavItem href="/admin/settings" icon={Settings} label="Platform Settings" onClick={onItemClick} />
        </div>
      </nav>

      <div className="border-t p-4">
        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded hover:bg-red-50">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  )
}

function AdminDeviceModal({ type, onContinue }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white max-w-md w-full rounded-xl p-6 text-center space-y-4">
        <div className="flex justify-center gap-4">
          <Image src="/vectors/laptop.svg" alt="Laptop" width={80} height={80} />
          <Image src="/vectors/tablet.svg" alt="Tablet" width={80} height={80} />
        </div>

        <h2 className="text-lg font-semibold">
          Admin Panel Optimized for Large Screens
        </h2>

        <p className="text-sm text-gray-600">
          {type === "mobile"
            ? "The admin panel is best used on a laptop or desktop. You may continue on mobile, but some features may not work optimally."
            : "For the best experience, a laptop or desktop is recommended."}
        </p>

        <button
          onClick={onContinue}
          className="w-full mt-2 px-4 py-2 rounded-lg bg-black text-white text-sm"
        >
          Continue using via mobile
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [device, setDevice] = useState(null)
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/")
      else if (user.role !== "admin") router.replace("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      if (w < 768) setDevice("mobile")
      else if (w < 1024) setDevice("tablet")
      else setDevice("desktop")
    }

    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  if (loading || !user || user.role !== "admin" || !device) return null

  const allowAdmin = device === "desktop" || acknowledged

  return (
    <div className="h-screen bg-white overflow-hidden">
      {(device === "mobile" || device === "tablet") && !acknowledged && (
        <AdminDeviceModal
          type={device}
          onContinue={() => setAcknowledged(true)}
        />
      )}

      {allowAdmin && (
        <>
          <div className="lg:hidden border-b px-4 h-14 flex items-center justify-between">
            <span className="font-bold text-lg">Persona Admin</span>
            <button onClick={() => setOpen(true)}>
              <Menu />
            </button>
          </div>

          <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
            <aside className="hidden lg:flex w-64 border-r flex-col">
              <SidebarContent />
            </aside>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              {children}
            </main>
          </div>

          {open && (
            <>
              <div
                onClick={() => setOpen(false)}
                className="fixed inset-0 bg-black/40 z-40"
              />

              <aside className="fixed top-0 right-0 h-full w-64 bg-white z-50 shadow-xl flex flex-col">
                <div className="p-6 flex justify-between border-b">
                  <span className="font-bold text-lg">Persona Admin</span>
                  <button onClick={() => setOpen(false)}>
                    <X />
                  </button>
                </div>

                <SidebarContent onItemClick={() => setOpen(false)} />
              </aside>
            </>
          )}
        </>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Package,
  Ticket,
  Image,
  Megaphone,
  Mail,
  Search,
  Users,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  Printer
} from "lucide-react"

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false)

  const NavItem = ({ href, icon: Icon, label, onClick }) => (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100"
    >
      <Icon size={18} className="text-gray-600" />
      <span>{label}</span>
    </Link>
  )

  const SidebarContent = ({ onItemClick }) => (
  <>
    <div className="p-6 text-xl font-bold">Persona Admin</div>

    <nav className="px-4 text-sm flex-1 space-y-6 overflow-y-auto">

      <div>
        <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">
          Overview
        </p>
        <NavItem href="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={onItemClick} />
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
      </div>

      <div>
        <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">
          Content Management
        </p>
        <NavItem href="/admin/banners" icon={Image} label="Homepage Banners" onClick={onItemClick} />
        <NavItem href="/admin/offers" icon={Megaphone} label="Promotional Offers" onClick={onItemClick} />
      </div>

      <div>
        <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">
          Marketing
        </p>
        <NavItem href="/admin/email-campaigns" icon={Mail} label="Email Campaigns" onClick={onItemClick} />
        <NavItem href="/admin/seo" icon={Search} label="SEO Settings" onClick={onItemClick} />
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


  return (
    <div className="h-screen bg-white overflow-hidden">

      {/* Mobile Top Bar */}
      <div className="lg:hidden border-b bg-white px-4 h-14 flex items-center justify-between">
        <span className="font-bold text-lg">Persona Admin</span>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center"
        >
          <Menu />
        </button>
      </div>

      {/* Layout */}
      <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">

       <aside className="hidden lg:flex w-64 bg-white border-r h-full flex-col shrink-0">
  <SidebarContent />
</aside>


        {/* Main Content (ONLY scrollable area) */}
        <main className="flex-1  overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/40 z-40"
          />

        <aside className="fixed top-0 right-0 h-full w-64 bg-white z-50 shadow-xl flex flex-col">
  <div className="p-6 flex items-center justify-between border-b">
    <span className="font-bold text-lg">Persona Admin</span>
    <button onClick={() => setOpen(false)}>
      <X />
    </button>
  </div>

  <SidebarContent onItemClick={() => setOpen(false)} />
</aside>

        </>
      )}
    </div>
  )
}

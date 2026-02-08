"use client"

import { Users, ShoppingCart, Package, Percent } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 18) return "Good Afternoon"
  return "Good Evening"
}

export default function DashboardPage() {
  const { user } = useAuth()

  const name = user?.firstName || "Admin"
  const role = user?.role === "admin" ? "Admin" : "User"

  const stats = [
    { label: "Total Users", value: "1,248", icon: Users },
    { label: "Total Orders", value: "342", icon: ShoppingCart },
    { label: "Products", value: "58", icon: Package },
    { label: "Active Coupons", value: "12", icon: Percent },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {getGreeting()}, {name}
          </h1>
          <p className="text-sm text-gray-600">
            Here’s what’s happening on the platform
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 capitalize">
          {role}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="bg-white border rounded-lg p-4 flex justify-between"
            >
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-semibold mt-1">{s.value}</p>
              </div>
              <Icon className="text-gray-400 w-6 h-6" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

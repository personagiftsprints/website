"use client"

import { Users, ShoppingCart, Package, Percent } from "lucide-react"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 18) return "Good Afternoon"
  return "Good Evening"
}

export default function DashboardPage() {
  const adminName = "Ezra"
  const role = "Super Admin"

  const stats = [
    {
      label: "Total Users",
      value: "1,248",
      icon: Users,
    },
    {
      label: "Total Orders",
      value: "342",
      icon: ShoppingCart,
    },
    {
      label: "Products",
      value: "58",
      icon: Package,
    },
    {
      label: "Active Coupons",
      value: "12",
      icon: Percent,
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8 px-2">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {getGreeting()}, {adminName}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Here’s what’s happening on the platform
          </p>
        </div>

        <span
          className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${
            role === "Super Admin"
              ? "bg-purple-50 text-purple-700 border-purple-200"
              : role === "Admin"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          {role}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white border rounded-lg p-4 sm:p-6 flex items-center justify-between"
            >
              <div>
                <p className="text-xs sm:text-sm text-gray-500">
                  {stat.label}
                </p>
                <p className="text-xl sm:text-2xl font-semibold mt-1">
                  {stat.value}
                </p>
              </div>

              <Icon className="text-gray-400 w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white border rounded-lg p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4">
          Recent Orders
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b pb-2">
            <span>John Doe ordered Custom T-Shirt</span>
            <span className="text-gray-500">£29.99</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b pb-2">
            <span>Emma Watson ordered Photo Mug</span>
            <span className="text-gray-500">£14.50</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span>Alex Smith ordered Hoodie</span>
            <span className="text-gray-500">£49.00</span>
          </div>
        </div>
      </div>

    </div>
  )
}

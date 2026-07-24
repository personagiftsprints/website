"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users,
  ShoppingCart,
  Package,
  Percent,
  DollarSign,
  Clock,
  AlertCircle,
  Printer,
  Truck,
  XCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
  Calendar,
  ChevronDown
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getDashboardSummary } from "@/services/admin.service"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 18) return "Good Afternoon"
  return "Good Evening"
}

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 text-white p-3 px-4 rounded-xl shadow-2xl border border-gray-800 text-xs backdrop-blur-md space-y-1">
        <p className="font-semibold text-gray-400">{label}</p>
        <p className="text-base font-bold text-emerald-400">
          £{payload[0].value?.toLocaleString() || 0}
        </p>
      </div>
    )
  }
  return null
}

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-gray-900/95 text-white p-3 px-4 rounded-xl shadow-2xl border border-gray-800 text-xs backdrop-blur-md space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="font-medium capitalize">{data.name.replace(/_/g, " ")}</span>
        </div>
        <p className="text-base font-bold text-white">
          {data.value} {data.value === 1 ? "Order" : "Orders"}
        </p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { user } = useAuth()

  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    activeCoupons: 0,
    revenue: { total: 0, trend: [] },
    orders: {
      pending: 0,
      processing: 0,
      printing: 0,
      out_for_delivery: 0,
      cancelled: 0
    }
  })

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      try {
        const res = await getDashboardSummary(selectedPeriod)
        setStats(res)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [selectedPeriod])

  const kpiCards = [
    {
      label: "Total Revenue",
      value: `£${stats.revenue.total.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-600",
      glow: "group-hover:shadow-emerald-500/20",
      badge: "Revenue",
      change: "+12.5%"
    },
    {
      label: "Total Customers",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      gradient: "from-indigo-500 to-purple-600",
      glow: "group-hover:shadow-indigo-500/20",
      badge: "Users",
      change: "+8.2%"
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      gradient: "from-blue-500 to-cyan-600",
      glow: "group-hover:shadow-blue-500/20",
      badge: "Orders",
      change: "+15.4%"
    },
    {
      label: "Active Products",
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      gradient: "from-amber-500 to-orange-600",
      glow: "group-hover:shadow-amber-500/20",
      badge: "Products",
      change: "Catalog"
    },
    {
      label: "Active Coupons",
      value: stats.activeCoupons.toLocaleString(),
      icon: Percent,
      gradient: "from-rose-500 to-pink-600",
      glow: "group-hover:shadow-rose-500/20",
      badge: "Discounts",
      change: "Promos"
    }
  ]

  const statusColors = {
    pending: "#F59E0B",
    processing: "#3B82F6",
    printing: "#8B5CF6",
    out_for_delivery: "#10B981",
    cancelled: "#EF4444"
  }

  const statusBgGlow = {
    pending: "bg-amber-50 text-amber-600 border-amber-200",
    processing: "bg-blue-50 text-blue-600 border-blue-200",
    printing: "bg-purple-50 text-purple-600 border-purple-200",
    out_for_delivery: "bg-emerald-50 text-emerald-600 border-emerald-200",
    cancelled: "bg-red-50 text-red-600 border-red-200"
  }

  const getStatusIcon = (key) => {
    switch (key) {
      case "pending": return <Clock className="w-5 h-5 text-amber-500" />
      case "processing": return <AlertCircle className="w-5 h-5 text-blue-500" />
      case "printing": return <Printer className="w-5 h-5 text-purple-500" />
      case "out_for_delivery": return <Truck className="w-5 h-5 text-emerald-500" />
      case "cancelled": return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const pieData = Object.entries(stats.orders).map(([k, v]) => ({
    name: k,
    value: v
  }))

  const totalOrderCount = Object.values(stats.orders).reduce((a, b) => a + b, 0)

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-44 bg-gradient-to-r from-gray-200 to-gray-300 rounded-3xl" />
        
        {/* KPI Skeleton */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl border border-gray-200" />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-100 rounded-2xl border border-gray-200" />
          <div className="h-80 bg-gray-100 rounded-2xl border border-gray-200" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">

      {/* HEADER BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-800 to-zinc-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-800">
        
        {/* Decorative Background Elements */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 top-0 w-48 h-48 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live System Overview</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {getGreeting()}, {user?.firstName || "Admin"} 
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-xl">
            Here is your latest store analytics, sales trends, and order fulfillment breakdown.
          </p>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {kpiCards.map((c) => {
          const Icon = c.icon
          return (
            <div
              key={c.label}
              className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between ${c.glow}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {c.badge}
                </span>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${c.gradient} text-white flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <p className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {c.value}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs font-medium text-gray-500">{c.label}</p>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {c.change}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* CHARTS SECTION */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Revenue Analytics
              </h2>
              <p className="text-xs text-gray-500">
                Income trend breakdown over the selected period
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
              Total: £{stats.revenue.total.toLocaleString()}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenue.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `£${v}`}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Distribution Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">
                Order Distribution
              </h2>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                {totalOrderCount} Total
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Breakdown by current order fulfillment stage
            </p>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={statusColors[entry.name] || "#6B7280"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Summary Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-extrabold text-gray-900">{totalOrderCount}</p>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Orders</p>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
            {Object.entries(stats.orders).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between p-1.5 rounded-lg bg-gray-50">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: statusColors[k] || "#6B7280" }}
                  />
                  <span className="capitalize text-gray-600 truncate">{k.replace(/_/g, " ")}</span>
                </div>
                <span className="font-bold text-gray-900 ml-1">{v}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* FULFILLMENT PIPELINE SECTION */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Fulfillment Pipeline
            </h2>
            <p className="text-[11px] text-gray-500">
              Live status counts for active customer orders requiring processing
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {Object.entries(stats.orders).map(([key, value]) => {
            const percentage = totalOrderCount > 0 ? Math.round((value / totalOrderCount) * 100) : 0
            return (
              <Link
                key={key}
                href={`/admin/orders?status=${key}`}
                className={`p-2.5 rounded-xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group ${statusBgGlow[key] || "bg-gray-50 border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="capitalize text-[11px] font-bold tracking-tight truncate">
                    {key.replace(/_/g, " ")}
                  </span>
                  <div className="p-1 rounded-md bg-white/80 shadow-sm group-hover:scale-105 transition-transform">
                    {getStatusIcon(key)}
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-lg font-bold text-gray-900 leading-none">
                    {value}
                  </p>
                  <span className="text-[10px] font-semibold opacity-75">
                    {percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: statusColors[key] || "#3B82F6"
                    }}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

    </div>
  )
}

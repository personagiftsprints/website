"use client"

import { useEffect, useState } from "react"
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
  XCircle
} from "lucide-react"
import GrayLogo from "@/assets/icons/gray.png"
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
import Image from "next/image"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 18) return "Good Afternoon"
  return "Good Evening"
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

  const cards = [
    { label: "Revenue", value: `£${stats.revenue.total.toLocaleString()}`, icon: DollarSign },
    { label: "Users", value: stats.totalUsers.toLocaleString(), icon: Users },
    { label: "Orders", value: stats.totalOrders.toLocaleString(), icon: ShoppingCart },
    { label: "Products", value: stats.totalProducts.toLocaleString(), icon: Package },
    { label: "Coupons", value: stats.activeCoupons.toLocaleString(), icon: Percent }
  ]

  const statusColors = {
    pending: "#F59E0B",
    processing: "#3B82F6",
    printing: "#8B5CF6",
    out_for_delivery: "#10B981",
    cancelled: "#EF4444"
  }

  const getStatusIcon = (key) => {
    switch (key) {
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />
      case "processing": return <AlertCircle className="w-4 h-4 text-blue-500" />
      case "printing": return <Printer className="w-4 h-4 text-purple-500" />
      case "out_for_delivery": return <Truck className="w-4 h-4 text-green-500" />
      case "cancelled": return <XCircle className="w-4 h-4 text-red-500" />
    }
  }


  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-3">
        
        <p className="text-gray-600 font-medium">
          <Image src={GrayLogo} alt="logo" className="w-32 animate-pulse"/>
          Loading dashboard...
        </p>
      </div>
    </div>
  )
}


  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {getGreeting()}, {user?.firstName || "Admin"}
          </h1>
          <p className="text-gray-500">Live business overview</p>
        </div>

        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        >
          <option value="today">Today</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>

      {/* STAT CARDS */}
      <div className="grid md:grid-cols-5 gap-6">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="bg-white p-6 rounded-xl shadow border border-gray-200">
              
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold">
                {loading ? "..." : c.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border-gray-400 border">
          <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenue.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#93C5FD"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border-gray-400  border">
          <h2 className="text-lg font-semibold mb-4">Order Distribution</h2>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(stats.orders).map(([k, v]) => ({
                    name: k,
                    value: v
                  }))}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {Object.entries(stats.orders).map(([k], i) => (
                    <Cell key={i} fill={statusColors[k]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ORDER STATUS BREAKDOWN */}
      <div className="grid md:grid-cols-6 gap-6">
        {Object.entries(stats.orders).map(([key, value]) => (
          <div key={key} className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <div className="flex justify-between mb-2">
              <span className="capitalize text-sm text-gray-500">
                {key.replace(/_/g, " ")}
              </span>
              {getStatusIcon(key)}
            </div>
            <p className="text-2xl font-bold">
              {loading ? "..." : value}
            </p>
          </div>
        ))}
      </div>

    </div>
  )
}

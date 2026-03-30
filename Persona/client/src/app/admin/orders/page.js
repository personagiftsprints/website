"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Search,
  Filter,
  Eye,
  Mail,
  Loader2
} from "lucide-react"
import { getAllOrdersAdmin, sendInvoiceEmail } from "@/services/admin.service"
import GrayLogo from "@/assets/icons/gray.png"
import Image from "next/image"
const STATUS_STYLES = {
  created: "bg-gray-100 text-gray-700",
  paid: "bg-emerald-100 text-emerald-700",
  processing: "bg-blue-100 text-blue-700",
  printing: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  collected: "bg-teal-100 text-teal-700",
  cancelled: "bg-red-100 text-red-700"
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getAllOrdersAdmin()
        setOrders(res.orders || [])
        setFiltered(res.orders || [])
      } catch (err) {
        console.error("Failed to load orders", err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  useEffect(() => {
    let data = [...orders]

    if (statusFilter !== "all") {
      data = data.filter(o => o.orderStatus === statusFilter)
    }

    if (search) {
      data = data.filter(o =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase())
      )
    }

    setFiltered(data)
  }, [search, statusFilter, orders])
  
  const handleSendInvoice = async (orderId) => {
    try {
      setSendingId(orderId)
      await sendInvoiceEmail(orderId)
      alert("Invoice sent successfully to the customer!")
    } catch (err) {
      console.error("Failed to send invoice", err)
      alert(err.response?.data?.message || "Failed to send invoice")
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="max-w-8xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all customer orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="created">Created</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="printing">Printing</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="collected">Collected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-gray-600">
                <th className="p-4 font-medium">Order</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>

            <tbody>

              {loading && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500 justify-center items-center flex flex-col">
                    <Image src={GrayLogo} alt="logo"  className="w-32 animate-pulse"/>
                    <p>Loading orders...</p>
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              )}

              {!loading && filtered.map(order => (
                <tr
                  key={order._id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-medium text-gray-900">
                    #{order.orderNumber}
                  </td>

                  <td className="p-4 text-gray-600 capitalize">
                    {order.userType}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        STATUS_STYLES[order.orderStatus]
                      }`}
                    >
                      {order.orderStatus.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="p-4 font-semibold">
                    £{order.totalAmount.toFixed(2)}
                  </td>

                  <td className="p-4 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-GB")}
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-3 px-4 py-4">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Link>
                      
                      <button
                        onClick={() => handleSendInvoice(order._id)}
                        disabled={sendingId === order._id}
                        className={`inline-flex items-center gap-1.5 font-medium transition-colors
                          ${sendingId === order._id ? 'text-zinc-400 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-800'}`}
                      >
                        {sendingId === order._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                        <span>{sendingId === order._id ? 'Sending...' : 'Email Invoice'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getAllOrdersAdmin } from "@/services/admin.service"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    getAllOrdersAdmin().then(res => {
      setOrders(res.orders)
    })
  }, [])

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">All Orders</h1>

      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Order</th>
              <th>User</th>
              <th>Status</th>
              <th>Total</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {orders.map(o => (
              <tr key={o._id} className="border-t">
                <td className="p-3">{o.orderNumber}</td>
                <td>{o.userType}</td>
                <td className="capitalize">{o.orderStatus}</td>
                <td>${o.totalAmount}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>
                  <Link
                    href={`/admin/orders/${o._id}`}
                    className="text-blue-600"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!orders.length && (
          <p className="p-6 text-center text-gray-500">
            No orders found
          </p>
        )}
      </div>
    </div>
  )
}

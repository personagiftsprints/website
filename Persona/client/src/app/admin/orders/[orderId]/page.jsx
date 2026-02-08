"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  getOrderAdminById,
  updateOrderStatus
} from "@/services/admin.service"

const STATUSES = [
  "paid",
  "processing",
  "printing",
  "shipped",
  "delivered",
  "cancelled"
]

export default function AdminOrderDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [status, setStatus] = useState("")

  useEffect(() => {
    getOrderAdminById(orderId).then(res => {
      setOrder(res.order)
      setStatus(res.order.orderStatus)
    })
  }, [orderId])

  const updateStatus = async () => {
    const res = await updateOrderStatus(orderId, status)
    setOrder(res.order)
    alert("Order status updated")
  }

  if (!order) return <p className="p-10">Loading…</p>

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Order {order.orderNumber}
      </h1>

      {/* ITEMS */}
      <div className="space-y-6">
        {order.items.map((item, i) => (
          <div
            key={i}
            className="border rounded-lg p-4 space-y-4"
          >
            {/* PRODUCT INFO */}
            <div className="flex gap-4">
              <img
                src={item.productSnapshot.image}
                className="w-24 h-24 object-cover rounded"
              />
              <div className="space-y-1">
                <p className="font-semibold text-lg">
                  {item.productSnapshot.name}
                </p>
                <p className="text-sm text-gray-600">
                  Type: {item.productSnapshot.type}
                </p>
                <p className="text-sm">
                  Qty: {item.quantity}
                </p>
                {item.variant && (
                  <p className="text-sm">
                    Size: {item.variant.size} • Color: {item.variant.color}
                  </p>
                )}
              </div>
            </div>

            {/* PRINT CONFIG */}
            {item.customization?.enabled && (
              <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
                <p className="font-semibold text-purple-700">
                  Print Configuration ({item.customization.printConfigType})
                </p>

                {Object.entries(item.customization.design || {}).map(
                  ([side, positions]) => (
                    <div key={side} className="space-y-2">
                      <p className="font-medium capitalize">
                        {side}
                      </p>

                      <div className="flex gap-4 flex-wrap">
                        {Object.entries(positions).map(
                          ([position, design]) =>
                            design.type === "image" &&
                            design.imageUrl && (
                              <div
                                key={position}
                                className="border bg-white rounded p-2 w-40"
                              >
                                <img
                                  src={design.imageUrl}
                                  className="w-full h-28 object-contain rounded"
                                />
                                <p className="text-xs text-center mt-1 capitalize">
                                  {position.replace("_", " ")}
                                </p>
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ORDER META */}
      <div className="border rounded-lg p-4 space-y-3">
        <p>
          <span className="font-medium">Total:</span>{" "}
          ${order.totalAmount}
        </p>
        <p>
          <span className="font-medium">User Type:</span>{" "}
          {order.userType}
        </p>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            onClick={updateStatus}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  )
}

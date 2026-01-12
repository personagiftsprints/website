"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getAllCoupons,
  toggleCouponStatus,
  deleteCoupon
} from "@/services/coupon.service"
import CreateCouponModal from "@/components/coupon/CreateCouponModal"
import { Trash2, Ban, CheckCircle, Plus } from "lucide-react"
import { formatDate } from "@/utils/date"

export default function CouponPage() {
  const [coupons, setCoupons] = useState([])
  const [open, setOpen] = useState(false)

  const loadCoupons = async () => {
    const data = await getAllCoupons()
    setCoupons(data)
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  const stats = useMemo(() => {
    return {
      total: coupons.length,
      active: coupons.filter(c => c.isActive).length,
      disabled: coupons.filter(c => !c.isActive).length
    }
  }, [coupons])

  const handleToggle = async (code) => {
    await toggleCouponStatus(code)
    loadCoupons()
  }

  const handleDelete = async (code) => {
    await deleteCoupon(code)
    loadCoupons()
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Coupons</h1>
          <p className="text-sm text-gray-500">
            Manage discount coupons and their availability
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded w-full sm:w-auto"
        >
          <Plus size={16} />
          Create Coupon
        </button>
      </div>

     <div className="hidden lg:grid grid-cols-3 gap-4">
  <StatCard label="Total Coupons" value={stats.total} />
  <StatCard label="Active" value={stats.active} />
  <StatCard label="Disabled" value={stats.disabled} />
</div>


      {/* Desktop Table */}
      <div className="hidden sm:block bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Discount</th>
              <th className="text-left px-4 py-3">Used</th>
              <th className="text-left px-4 py-3">Expiry</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c._id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-mono">{c.code}</td>
                <td className="px-4 py-3">{c.discount}%</td>
                <td className="px-4 py-3">{c.usedCount}</td>
                <td className="px-4 py-3">{formatDate(c.expiresAt)}</td>
                <td className="px-4 py-3">
                  <StatusBadge active={c.isActive} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-3">
                    <button
                      onClick={() => handleToggle(c.code)}
                      className="text-gray-600 hover:text-black"
                    >
                      {c.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(c.code)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-4">
        {coupons.map((c) => (
          <div key={c._id} className="bg-white border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">Code</p>
                <p className="font-mono font-semibold">{c.code}</p>
              </div>
              <StatusBadge active={c.isActive} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Discount</p>
                <p>{c.discount}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Used</p>
                <p>{c.usedCount}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Expiry</p>
                <p>{formatDate(c.expiresAt)}</p>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-2">
              <button onClick={() => handleToggle(c.code)}>
                {c.isActive ? <Ban size={18} /> : <CheckCircle size={18} />}
              </button>
              <button
                onClick={() => handleDelete(c.code)}
                className="text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <CreateCouponModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={loadCoupons}
      />
    </div>
  )
}

/* UI helpers */

function StatCard({ label, value }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
        active
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {active ? "Active" : "Disabled"}
    </span>
  )
}

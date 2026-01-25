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

  const stats = useMemo(() => ({
    total: coupons.length,
    active: coupons.filter(c => c.isActive).length,
    disabled: coupons.filter(c => !c.isActive).length
  }), [coupons])

  const handleToggle = async (code) => {
    await toggleCouponStatus(code)
    loadCoupons()
  }

  const handleDelete = async (code) => {
    await deleteCoupon(code)
    loadCoupons()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, enable, disable and monitor discount coupons
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus size={16} />
          New Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Coupons" value={stats.total} />
        <StatCard label="Active Coupons" value={stats.active} tone="success" />
        <StatCard label="Disabled Coupons" value={stats.disabled} tone="danger" />
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-gray-600">
              <th className="px-5 py-3 text-left font-medium">Code</th>
              <th className="px-5 py-3 text-left font-medium">Discount</th>
              <th className="px-5 py-3 text-left font-medium">Used</th>
              <th className="px-5 py-3 text-left font-medium">Expiry</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c._id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="px-5 py-4 font-mono font-medium text-gray-900">
                  {c.code}
                </td>
                <td className="px-5 py-4">{c.discount}%</td>
                <td className="px-5 py-4">{c.usedCount}</td>
                <td className="px-5 py-4">{formatDate(c.expiresAt)}</td>
                <td className="px-5 py-4">
                  <StatusBadge active={c.isActive} />
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <ActionButton
                      onClick={() => handleToggle(c.code)}
                      icon={c.isActive ? Ban : CheckCircle}
                      label={c.isActive ? "Disable" : "Enable"}
                    />
                    <ActionButton
                      onClick={() => handleDelete(c.code)}
                      icon={Trash2}
                      danger
                      label="Delete"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-4">
        {coupons.map(c => (
          <div key={c._id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Coupon Code</p>
                <p className="font-mono font-semibold text-gray-900">{c.code}</p>
              </div>
              <StatusBadge active={c.isActive} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem label="Discount" value={`${c.discount}%`} />
              <InfoItem label="Used" value={c.usedCount} />
              <InfoItem label="Expiry" value={formatDate(c.expiresAt)} full />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <IconButton
                onClick={() => handleToggle(c.code)}
                icon={c.isActive ? Ban : CheckCircle}
              />
              <IconButton
                onClick={() => handleDelete(c.code)}
                icon={Trash2}
                danger
              />
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

/* ---------- UI Helpers ---------- */

function StatCard({ label, value, tone }) {
  const toneMap = {
    success: "text-green-600",
    danger: "text-red-600"
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${toneMap[tone] || "text-gray-900"}`}>
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
      active
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
    }`}>
      {active ? "Active" : "Disabled"}
    </span>
  )
}

function ActionButton({ onClick, icon: Icon, label, danger }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-2 rounded-lg border ${
        danger
          ? "text-red-600 border-red-200 hover:bg-red-50"
          : "text-gray-600 border-gray-200 hover:bg-gray-100"
      }`}
    >
      <Icon size={16} />
    </button>
  )
}

function IconButton({ onClick, icon: Icon, danger }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Icon size={18} />
    </button>
  )
}

function InfoItem({ label, value, full }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  )
}

"use client"

import { useState } from "react"
import {
  generateCouponCode,
  createCoupon
} from "@/services/coupon.service"

export default function CreateCouponModal({ open, onClose, onCreated }) {
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [code, setCode] = useState("")
  const [discount, setDiscount] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleGenerate = async () => {
    const generatedCode = await generateCouponCode()
    console.log("CODE:")
    setCode(generatedCode)
  }

  const submit = async () => {
    if (!code || !discount) return

    setLoading(true)
    await createCoupon({
      code,
      discount: Number(discount),
      expiresAt: expiresAt || null
    })
    setLoading(false)

    setCode("")
    setDiscount("")
    setExpiresAt("")
    setAutoGenerate(true)

    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Create Coupon</h2>

        <div className="flex items-center justify-between mb-4">
          <span>Auto-generate code</span>
          <button
            onClick={() => setAutoGenerate(!autoGenerate)}
            className={`w-12 h-6 rounded-full relative ${
              autoGenerate ? "bg-black" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                autoGenerate ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Coupon Code</label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={autoGenerate}
              className="flex-1 border rounded px-3 py-2"
            />
            {autoGenerate && (
              <button
                onClick={handleGenerate}
                className="px-3 py-2 border rounded"
              >
                Generate
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Discount (%)</label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm mb-1">Expiry Date</label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  )
}

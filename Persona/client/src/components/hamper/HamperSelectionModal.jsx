"use client"

import { useState, useEffect } from "react"
import hamper1 from "@/assets/hamper/1.webp"
import hamper2 from "@/assets/hamper/2.webp"
import hamper3 from "@/assets/hamper/3.webp"
import Image from "next/image"

const hamperOptions = [
  { id: "basic", label: "Basic Hamper", media: hamper1 ,price: 4},
  { id: "premium", label: "Premium Hamper", media: hamper2,price: 9 },
  { id: "luxury", label: "Luxury Hamper", media: hamper3,price:14 },
]

export default function HamperSelectionModal({
  open,
  onClose,
  onSelect,
}) {
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!open) setSelected(null)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl p-8">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Select Hamper Type
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
  {hamperOptions.map(option => (
    <div
      key={option.id}
      onClick={() => setSelected(option.id)}
      className={`cursor-pointer border rounded-xl overflow-hidden transition ${
        selected === option.id
          ? "border-indigo-600 ring-2 ring-indigo-200"
          : "border-gray-200"
      }`}
    >
      <div className="relative w-full h-56">
        <Image
          src={option.media}
          alt={option.label}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-4 text-center font-medium">
      {option.label}
      </div>
       <div className="p-4 text-center font-medium">
      £{option.price}
      </div>
    </div>
  ))}
</div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border"
          >
            Cancel
          </button>

          <button
            disabled={!selected}
            onClick={() => {
              if (!selected) return
              onSelect(selected)
              onClose()
            }}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
          >
            Confirm
          </button>
        </div>

      </div>
    </div>
  )
}
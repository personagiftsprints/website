"use client"

import { useState, useEffect } from "react"
import hamper1 from "@/assets/hamper/1.jpeg"
import hamper2 from "@/assets/hamper/2.jpeg"
import hamper3 from "@/assets/hamper/3.jpeg"
import Image from "next/image"

const hamperOptions = [
  {
    id: "basic",
    label: "Silver Level",
    media: hamper1,
    price: 4,
    description: "Small-sized hamper, perfect for 1–2 personalised items",
  },
  {
    id: "premium",
    label: "Gold Level",
    media: hamper2,
    price: 9,
    description: "Medium-sized hamper, perfect for 3–4 personalised items",
  },
  {
    id: "luxury",
    label: "Platinum Level",
    media: hamper3,
    price: 14,
    description: "Large-sized hamper, perfect for 6–7 personalised items",
  },
]

export default function HamperSelectionModal({
  open,
  onClose,
  onSelect,
  selectedHamper,
}) {
  const [selected, setSelected] = useState(selectedHamper)

  useEffect(() => {
    if (open) setSelected(selectedHamper)
  }, [open, selectedHamper])

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

    <div className="p-4 text-center">
  <div className="font-semibold">{option.label}</div>

  <div className="text-sm text-gray-500 mt-1">
    {option.description}
  </div>

  <div className="mt-2 font-medium text-indigo-600">
    £{option.price}
  </div>
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
"use client"

import { useState } from "react"

export default function AddDesignPage() {
  const [title, setTitle] = useState("")
  const [product, setProduct] = useState("")
  const [image, setImage] = useState(null)
  const [active, setActive] = useState(true)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Add New Design</h1>

      <div className="space-y-4">

        <div>
          <label className="block text-sm font-medium mb-1">
            Design Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter design title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Applicable Product
          </label>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Select product</option>
            <option value="tshirt">T-Shirt</option>
            <option value="hoodie">Hoodie</option>
            <option value="mug">Mug</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Upload Design Image
          </label>
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            onChange={() => setActive(!active)}
          />
          <label className="text-sm">Active</label>
        </div>

        <button className="bg-black text-white px-6 py-2 rounded-lg">
          Save Design
        </button>

      </div>
    </div>
  )
}
"use client"

import TshirtStudio from "@/components/TshirtStudio"

export default function StudioPage() {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-100">
      <div className="w-64 bg-white border-r p-4">
        <h2 className="font-semibold mb-4">Design Tools</h2>
        <button id="upload-btn" className="w-full bg-black text-white py-2 rounded">
          Upload Image
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <TshirtStudio />
      </div>

      <div className="w-64 bg-white border-l p-4">
        <button id="save-btn" className="w-full bg-green-600 text-white py-2 rounded">
          Save Design
        </button>
      </div>
    </div>
  )
}

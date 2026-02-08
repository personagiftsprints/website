// components/ModelSpecifications.jsx
import React from "react"

export default function ModelSpecifications({ model }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h4 className="font-medium text-gray-900 mb-3">Model Specifications</h4>
      <div className="space-y-2 text-sm text-gray-700">
        <p><span className="text-gray-600">Dimensions:</span> {model.dimensions.height} × {model.dimensions.width} × {model.dimensions.thickness}</p>
        <p><span className="text-gray-600">Year:</span> {model.year}</p>
        <p><span className="text-gray-600">Model Code:</span> <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">{model.modelCode}</code></p>
      </div>
    </div>
  )
}
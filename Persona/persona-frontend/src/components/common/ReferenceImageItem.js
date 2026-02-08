import React from "react"
import { Upload, X } from "lucide-react"

export default function ReferenceImageItem({
  imageUrl,
  refIdx,
  areaIdx,
  isEditing,
  onReplaceReference,
  onRemoveReference,
  onFileChange,
  prefix,
  modelIndex
}) {
  return (
    <div className="relative w-28 h-28 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 group">
      <img
        src={imageUrl}
        alt={`Reference ${refIdx + 1}`}
        className="w-full h-full object-cover"
      />

      {isEditing && (
        <>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition" />

          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={onReplaceReference}
              className="p-1.5 bg-white rounded"
            >
              <Upload className="w-4 h-4 text-gray-700" />
            </button>

            <button
              onClick={onRemoveReference}
              className="p-1.5 bg-red-600 rounded"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <input
            id={`ref-input-${prefix}-${modelIndex}-${areaIdx}-${refIdx}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFileChange(prefix, areaIdx, refIdx, e)}
          />
        </>
      )}
    </div>
  )
}

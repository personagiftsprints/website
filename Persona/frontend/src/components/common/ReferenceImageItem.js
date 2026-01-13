// components/ReferenceImageItem.jsx
import React from "react"
import { Upload, X } from "lucide-react"

export default function ReferenceImageItem({
  ref,
  refIdx,
  areaIdx,
  isEditing,
  onReplaceReference,
  onRemoveReference,
  onFileChange,
  referenceInputKeys,
  onUpdateReferenceImage,
  prefix,
  modelIndex
}) {
  return (
    <div className="relative group">
      <a
        href={ref}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-28 h-28 rounded overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
      >
        <img
          src={ref}
          alt={`Reference ${refIdx + 1}`}
          className="w-full h-full object-cover"
          onError={e => {
            e.currentTarget.src = "https://placehold.co/100x100?text=Not+Found"
          }}
        />
      </a>
      
      {/* Edit/Delete Controls (only in edit mode) */}
      {isEditing && (
        <>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={onReplaceReference}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
              title="Replace this image"
            >
              <Upload className="w-3 h-3 text-gray-700" />
            </button>
            <button
              onClick={onRemoveReference}
              className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
              title="Remove this image"
            >
              <X className="w-3 h-3 text-red-600" />
            </button>
          </div>
          
          {/* Hidden file input for this specific reference */}
          <input
            id={`ref-input-${prefix}-${modelIndex}-${areaIdx}-${refIdx}`}
            key={referenceInputKeys[`${prefix}-${modelIndex}-${areaIdx}-${refIdx}`] || refIdx}
            type="file"
            accept="image/*"
            onChange={(e) => onFileChange(prefix, areaIdx, refIdx, e)}
            className="hidden"
          />
        </>
      )}
      
      {/* Hidden URL input for reference */}
      <div className="sr-only" aria-hidden="true">
        <input
          type="text"
          value={ref || ""}
          onChange={(e) => onUpdateReferenceImage(prefix, areaIdx, refIdx, e.target.value.trim())}
          placeholder="https://example.com/reference-image.jpg"
          disabled={!isEditing}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
        />
      </div>
    </div>
  )
}
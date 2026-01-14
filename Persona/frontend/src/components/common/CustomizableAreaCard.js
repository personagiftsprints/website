
import React from "react"
import { ImageIcon, Info, ChevronDown, ChevronUp, Plus, Upload, X } from "lucide-react"
import ReferenceImageItem from "./ReferenceImageItem"

export default function CustomizableAreaCard({ 
  area, 
  idx, 
  isEditing, 
  expandedArea, 
  onToggleReferences,
  onAddReference,
  onReplaceReference,
  onRemoveReference,
  onFileChange,
  referenceInputKeys,
  onUpdateReferenceImage,
  prefix,
  modelIndex
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-gray-900">{area.name}</h4>
      </div>

      <div className="space-y-2 text-sm text-gray-700">
        <p><span className="text-gray-600">ID:</span> <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">{area.id}</code></p>
        <p><span className="text-gray-600">Max Size:</span> <span className="font-medium">{area.max}</span></p>
        {area.type && (
          <p><span className="text-gray-600">Type:</span> <span className="capitalize font-medium">{area.type}</span></p>
        )}
        {area.description && (
          <p className="text-gray-600 mt-3 pt-2 border-t border-gray-100 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <span>{area.description}</span>
          </p>
        )}

        {/* References Section */}
        <div className="mt-3">
          <button
            onClick={() => onToggleReferences(idx)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <ImageIcon className="w-4 h-4" />
            Reference Examples ({area.references?.length || 0})
            {expandedArea === idx ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expandedArea === idx && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="space-y-3">
                {/* Add Reference Button (only in edit mode) */}
                {isEditing && (
                  <div className="text-center">
                    <button
                      onClick={() => onAddReference(idx)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Reference Image
                    </button>
                    <input
                      id={`add-ref-input-${prefix}-${modelIndex}-${idx}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => onFileChange(prefix, idx, area.references?.length || 0, e)}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Reference Images */}
                <div className="flex flex-wrap gap-3">
                  {area.references?.map((ref, refIdx) => (
                    <ReferenceImageItem
                      key={refIdx}
                      ref={ref}
                      refIdx={refIdx}
                      areaIdx={idx}
                      isEditing={isEditing}
                      onReplaceReference={() => onReplaceReference(idx, refIdx)}
                      onRemoveReference={() => onRemoveReference(idx, refIdx)}
                      onFileChange={onFileChange}
                      referenceInputKeys={referenceInputKeys}
                      onUpdateReferenceImage={onUpdateReferenceImage}
                      prefix={prefix}
                      modelIndex={modelIndex}
                    />
                  ))}
                </div>
                
                {(!area.references || area.references.length === 0) && (
                  <div className="text-center py-4 text-gray-400">
                    No reference images added yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
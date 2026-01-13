// components/BaseImageSection.jsx
import React from "react"
import { ImageIcon, Upload } from "lucide-react"

export default function BaseImageSection({
  title,
  subtitle = "",
  imageUrl,
  altText,
  aspectRatio = "aspect-[4/3]",
  maxHeight = "max-h-[340px]",
  placeholder = "https://placehold.co/800x600?text=No+Base+Image",
  isEditing,
  onReplaceBaseImageClick,
  onFileChange,
  baseImageInputKey,
  baseImageInputRef,
  fileInputKey,
  showFileInput = false
}) {
  return (
    <section className="lg:w-2/5 xl:w-1/3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-blue-600" />
        {title}
        {subtitle && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            {subtitle}
          </span>
        )}
      </h3>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-6">
        <div className={`${aspectRatio} ${maxHeight} bg-white rounded-lg overflow-hidden shadow-inner mx-auto`}>
          <img
            src={imageUrl || placeholder}
            alt={altText}
            className="w-full h-full object-contain"
            onError={e => e.currentTarget.src = "https://placehold.co/800x600?text=Image+Not+Found"}
          />
        </div>

        {/* Replace Photo Button (only shown in edit mode) */}
        {isEditing && (
          <div className="mt-4 text-center">
            <button
              onClick={onReplaceBaseImageClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 text-gray-700 font-medium transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Replace Base Image
            </button>
            
            {/* Hidden file input for base image */}
            {showFileInput && (
              <input
                key={fileInputKey || baseImageInputKey}
                ref={baseImageInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
            )}
            
            <p className="mt-2 text-sm text-gray-500">
              Upload a new base image (PNG, JPG, WebP recommended)
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
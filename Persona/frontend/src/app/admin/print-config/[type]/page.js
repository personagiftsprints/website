"use client"
import React, { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Eye, FileImage, ArrowLeft, Edit3, Check, 
  Image as ImageIcon, Info, ChevronDown, ChevronUp, Upload,
  X, Plus
} from "lucide-react"

export default function PrintConfigDetailPage() {
  const params = useParams()
  const router = useRouter()
  const type = params?.type

  const [config, setConfig] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeView, setActiveView] = useState(null)
  const [error, setError] = useState(null)
  const [expandedArea, setExpandedArea] = useState(null)
  const [baseImageInputKey, setBaseImageInputKey] = useState(Date.now())
  const [referenceInputKeys, setReferenceInputKeys] = useState({})

  const saveTimeoutRef = useRef(null)
  const baseImageInputRef = useRef(null)

  const fetchConfig = useCallback(async () => {
    if (!type) return
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/print-model`)
      if (!response.ok) throw new Error("Failed to fetch configurations")
      const data = await response.json()
      const found = (data.data || []).find(c => c.type === type)
      if (!found) throw new Error("Configuration not found")
      setConfig(found)
      setActiveView(Object.keys(found.views || {})[0] || null)
    } catch (err) {
      setError(err.message)
      console.error("Error fetching config:", err)
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    if (type) fetchConfig()
  }, [type, fetchConfig])

  const autoSave = useCallback(async (updatedConfig) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/print-model/${type}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedConfig)
        })
        if (!response.ok) throw new Error("Save failed")
        console.log("Auto-saved successfully")
      } catch (err) {
        console.error("Failed to update:", err)
        setError("Failed to save changes")
      } finally {
        setSaving(false)
      }
    }, 600)
  }, [type])

  const updateBaseImage = (viewKey, newUrl) => {
    if (!config?.views?.[viewKey]) return
    const updatedViews = {
      ...config.views,
      [viewKey]: { ...config.views[viewKey], baseImage: newUrl }
    }
    const newConfig = { ...config, views: updatedViews }
    setConfig(newConfig)
    if (isEditing) autoSave(newConfig)
  }

  const updateReferenceImage = (viewKey, areaIndex, referenceIndex, newUrl) => {
    if (!config?.views?.[viewKey]?.areas?.[areaIndex]) return
    
    const updatedAreas = [...config.views[viewKey].areas]
    const updatedReferences = [...(updatedAreas[areaIndex].references || [])]
    
    if (referenceIndex >= 0 && referenceIndex < updatedReferences.length) {
      updatedReferences[referenceIndex] = newUrl
    } else {
      updatedReferences.push(newUrl)
    }
    
    updatedAreas[areaIndex] = {
      ...updatedAreas[areaIndex],
      references: updatedReferences
    }
    
    const updatedViews = {
      ...config.views,
      [viewKey]: {
        ...config.views[viewKey],
        areas: updatedAreas
      }
    }
    
    const newConfig = { ...config, views: updatedViews }
    setConfig(newConfig)
    if (isEditing) autoSave(newConfig)
  }

  const removeReferenceImage = (viewKey, areaIndex, referenceIndex) => {
    if (!config?.views?.[viewKey]?.areas?.[areaIndex]) return
    
    const updatedAreas = [...config.views[viewKey].areas]
    const updatedReferences = [...(updatedAreas[areaIndex].references || [])]
    
    updatedReferences.splice(referenceIndex, 1)
    
    updatedAreas[areaIndex] = {
      ...updatedAreas[areaIndex],
      references: updatedReferences
    }
    
    const updatedViews = {
      ...config.views,
      [viewKey]: {
        ...config.views[viewKey],
        areas: updatedAreas
      }
    }
    
    const newConfig = { ...config, views: updatedViews }
    setConfig(newConfig)
    if (isEditing) autoSave(newConfig)
  }

  const handleFileChange = (viewKey, areaIndex = null, referenceIndex = null, event) => {
    const file = event.target.files[0]
    if (!file) return

    // Create a local URL for preview
    const localUrl = URL.createObjectURL(file)
    
    if (areaIndex === null) {
      // Base image
      updateBaseImage(viewKey, localUrl)
      setBaseImageInputKey(Date.now())
    } else {
      // Reference image
      updateReferenceImage(viewKey, areaIndex, referenceIndex, localUrl)
      
      // Update reference input key
      setReferenceInputKeys(prev => ({
        ...prev,
        [`${viewKey}-${areaIndex}-${referenceIndex}`]: Date.now()
      }))
    }
  }

  const handleReplaceBaseImageClick = () => {
    if (baseImageInputRef.current) {
      baseImageInputRef.current.click()
    }
  }

  const handleReplaceReferenceClick = (areaIndex, referenceIndex) => {
    const inputId = `ref-input-${activeView}-${areaIndex}-${referenceIndex}`
    const input = document.getElementById(inputId)
    if (input) {
      input.click()
    }
  }

  const handleAddReferenceClick = (areaIndex) => {
    const inputId = `add-ref-input-${activeView}-${areaIndex}`
    const input = document.getElementById(inputId)
    if (input) {
      input.click()
    }
  }

  const toggleReferences = (areaIndex) => {
    setExpandedArea(expandedArea === areaIndex ? null : areaIndex)
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-gray-600">Loading configuration...</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => router.push("/admin/print-config")} className="text-blue-600 hover:underline">
          Back to configurations
        </button>
      </div>
    </div>
  )

  if (!config) return null

  const views = config.views || {}
  const viewKeys = Object.keys(views)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin/print-config")}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to list
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{config.name}</h1>
              <p className="mt-1 text-gray-600">
                Type: <span className="font-medium text-gray-900">{config.type}</span>
              </p>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              disabled={saving || viewKeys.length === 0}
              className={`inline-flex items-center px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm ${
                isEditing ? "bg-green-600 text-white hover:bg-green-700" : "bg-blue-600 text-white hover:bg-blue-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isEditing ? (
                <> <Check className="w-4 h-4 mr-2" /> Editing Mode </>
              ) : (
                <> <Edit3 className="w-4 h-4 mr-2" /> Edit Images </>
              )}
              {saving && <span className="ml-2 opacity-80">(saving…)</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl  border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Print Views & Base Images</h2>
          </div>

          <div className="p-6">
            {viewKeys.length === 0 ? (
              <div className="text-center py-16">
                <FileImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No views defined</h3>
              </div>
            ) : (
              <>
                {/* View Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-1">
                  {viewKeys.map(viewKey => (
                    <button
                      key={viewKey}
                      onClick={() => setActiveView(viewKey)}
                      className={`px-5 py-2.5 font-medium text-sm rounded-t-lg transition-colors ${
                        activeView === viewKey
                          ? "bg-white text-blue-600 border border-b-0 border-gray-200 -mb-px shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {viewKey.replace(/_/g, " ").toUpperCase()}
                    </button>
                  ))}
                </div>

               {activeView && views[activeView] && (
  <div className="space-y-10 lg:space-y-0 lg:flex lg:gap-8">
    {/* Left Column - Base Image */}
    <section className="lg:w-2/5 xl:w-1/3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-blue-600" />
        {activeView.replace(/_/g, " ").toUpperCase()} — Base Image
      </h3>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-6">
        <div className="aspect-[4/3] max-h-[340px] bg-white rounded-lg overflow-hidden shadow-inner mx-auto">
          <img
            src={views[activeView].baseImage || "https://placehold.co/800x600?text=No+Base+Image"}
            alt={`${activeView} base template`}
            className="w-full h-full object-contain"
            onError={e => e.currentTarget.src = "https://placehold.co/800x600?text=Image+Not+Found"}
          />
        </div>

        {/* Replace Photo Button (only shown in edit mode) */}
        {isEditing && (
          <div className="mt-4 text-center">
            <button
              onClick={handleReplaceBaseImageClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 text-gray-700 font-medium transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Replace Base Image
            </button>
            
            {/* Hidden file input for base image */}
            <input
              key={baseImageInputKey}
              ref={baseImageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(activeView, null, null, e)}
              className="hidden"
            />
            
            <p className="mt-2 text-sm text-gray-500">
              Upload a new base image (PNG, JPG, WebP recommended)
            </p>
          </div>
        )}
      </div>

      {/* URL Input Field (hidden from user view) */}
      <div className="sr-only" aria-hidden="true">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Base Image URL
        </label>
        <input
          type="text"
          value={views[activeView].baseImage || ""}
          onChange={e => updateBaseImage(activeView, e.target.value.trim())}
          placeholder="https://example.com/base-tshirt-front.png"
          disabled={!isEditing}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed font-mono text-sm"
        />
      </div>
    </section>

    {/* Right Column - Customizable Areas */}
    <section className="lg:w-3/5 xl:w-2/3 border-t lg:border-t-0 lg:border-l lg:border-gray-200 lg:pl-8 pt-8 lg:pt-0">
      <h3 className="text-lg font-semibold text-gray-900 mb-5">
        Customizable Areas ({views[activeView].areas?.length || 0})
      </h3>

      {views[activeView].areas?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {views[activeView].areas.map((area, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-sm transition-shadow"
            >
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
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{area.description}</span>
                  </p>
                )}

                {/* References Section */}
                <div className="mt-3">
                  <button
                    onClick={() => toggleReferences(idx)}
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
                              onClick={() => handleAddReferenceClick(idx)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Add Reference Image
                            </button>
                            <input
                              id={`add-ref-input-${activeView}-${idx}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(activeView, idx, area.references?.length || 0, e)}
                              className="hidden"
                            />
                          </div>
                        )}

                        {/* Reference Images */}
                        <div className="flex flex-wrap gap-3">
                          {area.references?.map((ref, refIdx) => (
                            <div key={refIdx} className="relative group">
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
                                      onClick={() => handleReplaceReferenceClick(idx, refIdx)}
                                      className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                                      title="Replace this image"
                                    >
                                      <Upload className="w-3 h-3 text-gray-700" />
                                    </button>
                                    <button
                                      onClick={() => removeReferenceImage(activeView, idx, refIdx)}
                                      className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                                      title="Remove this image"
                                    >
                                      <X className="w-3 h-3 text-red-600" />
                                    </button>
                                  </div>
                                  
                                  {/* Hidden file input for this specific reference */}
                                  <input
                                    id={`ref-input-${activeView}-${idx}-${refIdx}`}
                                    key={referenceInputKeys[`${activeView}-${idx}-${refIdx}`] || refIdx}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(activeView, idx, refIdx, e)}
                                    className="hidden"
                                  />
                                </>
                              )}
                              
                              {/* Hidden URL input for reference */}
                              <div className="sr-only" aria-hidden="true">
                                <input
                                  type="text"
                                  value={ref || ""}
                                  onChange={(e) => updateReferenceImage(activeView, idx, refIdx, e.target.value.trim())}
                                  placeholder="https://example.com/reference-image.jpg"
                                  disabled={!isEditing}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                              </div>
                            </div>
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
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">No customizable areas defined for this view</p>
        </div>
      )}
    </section>
  </div>
)}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
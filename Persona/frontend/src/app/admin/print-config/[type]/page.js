"use client"
import React, { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit3, Check, Smartphone, FileImage } from "lucide-react"

// Import components
import LoadingState from "@/components/common/LoadingState"
import ErrorState from "@/components/common/ErrorState"
import BaseImageSection from "@/components/common/BaseImageSection"
import CustomizableAreaCard from "@/components/common/CustomizableAreaCard"
import ModelSpecifications from "@/components/common/ModelSpecifications"

export default function PrintConfigDetailPage() {
  const params = useParams()
  const router = useRouter()
  const type = params?.type

  const [config, setConfig] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeView, setActiveView] = useState(null)
  const [activeModelIndex, setActiveModelIndex] = useState(0)
  const [error, setError] = useState(null)
  const [expandedArea, setExpandedArea] = useState(null)
  const [baseImageInputKey, setBaseImageInputKey] = useState(Date.now())
  const [referenceInputKeys, setReferenceInputKeys] = useState({})

  const saveTimeoutRef = useRef(null)
  const baseImageInputRef = useRef(null)

  const isMobileCase = config?.type === "mobileCase"

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
      
      // Set initial active view or model
      if (found.type === "mobileCase") {
        setActiveModelIndex(0)
      } else {
        setActiveView(Object.keys(found.views || {})[0] || null)
      }
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

  // Update base image for regular products
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

  // Update base image for mobile case models
  const updateMobileCaseBaseImage = (modelIndex, newUrl) => {
    if (!config?.models?.[modelIndex]) return
    
    const updatedModels = [...config.models]
    updatedModels[modelIndex] = {
      ...updatedModels[modelIndex],
      view: {
        ...updatedModels[modelIndex].view,
        baseImage: newUrl
      }
    }
    
    const newConfig = { ...config, models: updatedModels }
    setConfig(newConfig)
    if (isEditing) autoSave(newConfig)
  }

  // Update reference image for regular products
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

  // Update reference image for mobile case models
  const updateMobileCaseReferenceImage = (modelIndex, areaIndex, referenceIndex, newUrl) => {
    if (!config?.models?.[modelIndex]?.view?.areas?.[areaIndex]) return
    
    const updatedModels = [...config.models]
    const updatedAreas = [...updatedModels[modelIndex].view.areas]
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
    
    updatedModels[modelIndex] = {
      ...updatedModels[modelIndex],
      view: {
        ...updatedModels[modelIndex].view,
        areas: updatedAreas
      }
    }
    
    const newConfig = { ...config, models: updatedModels }
    setConfig(newConfig)
    if (isEditing) autoSave(newConfig)
  }

  // Remove reference image for regular products
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

  // Remove reference image for mobile case models
  const removeMobileCaseReferenceImage = (modelIndex, areaIndex, referenceIndex) => {
    if (!config?.models?.[modelIndex]?.view?.areas?.[areaIndex]) return
    
    const updatedModels = [...config.models]
    const updatedAreas = [...updatedModels[modelIndex].view.areas]
    const updatedReferences = [...(updatedAreas[areaIndex].references || [])]
    
    updatedReferences.splice(referenceIndex, 1)
    
    updatedAreas[areaIndex] = {
      ...updatedAreas[areaIndex],
      references: updatedReferences
    }
    
    updatedModels[modelIndex] = {
      ...updatedModels[modelIndex],
      view: {
        ...updatedModels[modelIndex].view,
        areas: updatedAreas
      }
    }
    
    const newConfig = { ...config, models: updatedModels }
    setConfig(newConfig)
    if (isEditing) autoSave(newConfig)
  }

  const handleFileChange = (viewKey, areaIndex = null, referenceIndex = null, event) => {
    const file = event.target.files[0]
    if (!file) return

    // Create a local URL for preview
    const localUrl = URL.createObjectURL(file)
    
    if (isMobileCase) {
      // For mobile case models
      if (areaIndex === null) {
        // Base image for mobile case
        updateMobileCaseBaseImage(activeModelIndex, localUrl)
        setBaseImageInputKey(Date.now())
      } else {
        // Reference image for mobile case
        updateMobileCaseReferenceImage(activeModelIndex, areaIndex, referenceIndex, localUrl)
        
        setReferenceInputKeys(prev => ({
          ...prev,
          [`mobile-${activeModelIndex}-${areaIndex}-${referenceIndex}`]: Date.now()
        }))
      }
    } else {
      // For regular products
      if (areaIndex === null) {
        // Base image
        updateBaseImage(viewKey, localUrl)
        setBaseImageInputKey(Date.now())
      } else {
        // Reference image
        updateReferenceImage(viewKey, areaIndex, referenceIndex, localUrl)
        
        setReferenceInputKeys(prev => ({
          ...prev,
          [`${viewKey}-${areaIndex}-${referenceIndex}`]: Date.now()
        }))
      }
    }
  }

  const handleReplaceBaseImageClick = () => {
    if (baseImageInputRef.current) {
      baseImageInputRef.current.click()
    }
  }

  const handleReplaceReferenceClick = (areaIndex, referenceIndex) => {
    const prefix = isMobileCase ? "mobile" : activeView
    const modelIndex = isMobileCase ? activeModelIndex : 0
    const inputId = isMobileCase 
      ? `ref-input-mobile-${modelIndex}-${areaIndex}-${referenceIndex}`
      : `ref-input-${activeView}-${areaIndex}-${referenceIndex}`
    
    const input = document.getElementById(inputId)
    if (input) {
      input.click()
    }
  }

  const handleAddReferenceClick = (areaIndex) => {
    const prefix = isMobileCase ? "mobile" : activeView
    const modelIndex = isMobileCase ? activeModelIndex : 0
    const inputId = isMobileCase 
      ? `add-ref-input-mobile-${modelIndex}-${areaIndex}`
      : `add-ref-input-${activeView}-${areaIndex}`
    
    const input = document.getElementById(inputId)
    if (input) {
      input.click()
    }
  }

  const toggleReferences = (areaIndex) => {
    setExpandedArea(expandedArea === areaIndex ? null : areaIndex)
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} onBack={() => router.push("/admin/print-config")} />
  if (!config) return null

  const views = !isMobileCase ? config.views || {} : {}
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
              disabled={saving || (isMobileCase ? !config.models?.length : viewKeys.length === 0)}
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isMobileCase ? "Mobile Case Models" : "Print Views & Base Images"}
            </h2>
          </div>

          <div className="p-6">
            {/* Mobile Case Layout */}
            {isMobileCase ? (
              <div>
                {/* Model Selection Tabs */}
                {config.models?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-1">
                    {config.models.map((model, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveModelIndex(idx)}
                        className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                          activeModelIndex === idx
                            ? "bg-white text-blue-600 border border-b-0 border-gray-200 -mb-px shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          {model.modelName}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Active Model Content */}
                {config.models?.[activeModelIndex] && (
                  <div className="space-y-10 lg:space-y-0 lg:flex lg:gap-8">
                    <BaseImageSection
                      title={`${config.models[activeModelIndex].modelName} — Base Image`}
                      subtitle={`(${config.models[activeModelIndex].displaySize}, ${config.models[activeModelIndex].year})`}
                      imageUrl={config.models[activeModelIndex].view.baseImage}
                      altText={`${config.models[activeModelIndex].modelName} case template`}
                      aspectRatio="aspect-[3/4]"
                      maxHeight="max-h-[400px]"
                      placeholder="https://placehold.co/600x800?text=No+Base+Image"
                      isEditing={isEditing}
                      onReplaceBaseImageClick={handleReplaceBaseImageClick}
                      onFileChange={(e) => handleFileChange("mobile", null, null, e)}
                      baseImageInputKey={baseImageInputKey}
                      baseImageInputRef={baseImageInputRef}
                      showFileInput={true}
                    />

                    {/* Model Specifications */}
                    <ModelSpecifications model={config.models[activeModelIndex]} />

                    {/* Right Column - Customizable Areas */}
                    <section className="lg:w-3/5 xl:w-2/3 border-t lg:border-t-0 lg:border-l lg:border-gray-200 lg:pl-8 pt-8 lg:pt-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-5">
                        Customizable Areas ({config.models[activeModelIndex].view.areas?.length || 0})
                      </h3>

                      {config.models[activeModelIndex].view.areas?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {config.models[activeModelIndex].view.areas.map((area, idx) => (
                            <CustomizableAreaCard
                              key={idx}
                              area={area}
                              idx={idx}
                              isEditing={isEditing}
                              expandedArea={expandedArea}
                              onToggleReferences={toggleReferences}
                              onAddReference={handleAddReferenceClick}
                              onReplaceReference={() => handleReplaceReferenceClick(idx, 0)}
                              onRemoveReference={() => removeMobileCaseReferenceImage(activeModelIndex, idx, 0)}
                              onFileChange={handleFileChange}
                              referenceInputKeys={referenceInputKeys}
                              onUpdateReferenceImage={(prefix, areaIdx, refIdx, newUrl) => 
                                updateMobileCaseReferenceImage(activeModelIndex, areaIdx, refIdx, newUrl)
                              }
                              prefix="mobile"
                              modelIndex={activeModelIndex}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <p className="text-gray-500">No customizable areas defined for this model</p>
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </div>
            ) : (
              /* Regular Product Layout */
              <>
                {viewKeys.length === 0 ? (
                  <div className="text-center py-16">
                    <FileImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No views defined</h3>
                  </div>
                ) : (
                  <>
                    {/* View Tabs for regular products */}
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

                    {/* Regular Product Content */}
                    {activeView && views[activeView] && (
                      <div className="space-y-10 lg:space-y-0 lg:flex lg:gap-8">
                        <BaseImageSection
                          title={`${activeView.replace(/_/g, " ").toUpperCase()} — Base Image`}
                          imageUrl={views[activeView].baseImage}
                          altText={`${activeView} base template`}
                          isEditing={isEditing}
                          onReplaceBaseImageClick={handleReplaceBaseImageClick}
                          onFileChange={(e) => handleFileChange(activeView, null, null, e)}
                          baseImageInputKey={baseImageInputKey}
                          baseImageInputRef={baseImageInputRef}
                          showFileInput={true}
                        />

                        {/* Right Column - Customizable Areas */}
                        <section className="lg:w-3/5 xl:w-2/3 border-t lg:border-t-0 lg:border-l lg:border-gray-200 lg:pl-8 pt-8 lg:pt-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-5">
                            Customizable Areas ({views[activeView].areas?.length || 0})
                          </h3>

                          {views[activeView].areas?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {views[activeView].areas.map((area, idx) => (
                                <CustomizableAreaCard
                                  key={idx}
                                  area={area}
                                  idx={idx}
                                  isEditing={isEditing}
                                  expandedArea={expandedArea}
                                  onToggleReferences={toggleReferences}
                                  onAddReference={handleAddReferenceClick}
                                  onReplaceReference={() => handleReplaceReferenceClick(idx, 0)}
                                  onRemoveReference={() => removeReferenceImage(activeView, idx, 0)}
                                  onFileChange={handleFileChange}
                                  referenceInputKeys={referenceInputKeys}
                                  onUpdateReferenceImage={(prefix, areaIdx, refIdx, newUrl) => 
                                    updateReferenceImage(activeView, areaIdx, refIdx, newUrl)
                                  }
                                  prefix={activeView}
                                  modelIndex={0}
                                />
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
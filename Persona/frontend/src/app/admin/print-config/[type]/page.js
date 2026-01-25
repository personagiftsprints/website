"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit3, Check, Smartphone, FileImage } from "lucide-react"

// Components
import LoadingState from "@/components/common/LoadingState"
import ErrorState from "@/components/common/ErrorState"
import BaseImageSection from "@/components/common/BaseImageSection"
import CustomizableAreaCard from "@/components/common/CustomizableAreaCard"
import ModelSpecifications from "@/components/common/ModelSpecifications"

export default function PrintConfigDetailPage() {
  const params = useParams()
  const router = useRouter()
  const type = params?.type

  console.log("Type:", type)

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
  const isGeneralPrint = config?.type === "general"

  const fetchConfig = useCallback(async () => {
    if (!type) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/print-model/models`)
      if (!response.ok) throw new Error("Failed to fetch configurations")

      const data = await response.json()
      const found = (data.data || []).find(c => c.type === type)

      if (!found) throw new Error("Configuration not found")

      setConfig(found)

      if (found.type === "mobileCase") {
        setActiveModelIndex(0)
      } else if (found.type === "general") {
        setActiveView("general")
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const autoSave = useCallback(
    async (updatedConfig) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setSaving(true)

          if (!config?._id) {
            console.error("Cannot auto-save: config._id missing", { type, config })
            setError("Cannot save — configuration ID missing")
            return
          }

          if (!type) {
            console.error("Cannot auto-save: type missing")
            return
          }

          const url = `${process.env.NEXT_PUBLIC_API_URL}/print-model/models/${type}/${config._id}`
          console.log("Auto-saving to:", url)

          const response = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedConfig)
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Save failed (${response.status}): ${errorText}`)
          }

          const result = await response.json()
          console.log("Auto-save success:", result)
        } catch (err) {
          console.error("Auto-save error:", err)
          setError("Failed to save changes — check console")
        } finally {
          setSaving(false)
        }
      }, 800)
    },
    [type, config?._id]
  )

const updateBaseImage = (viewKey, newUrl) => {
  if (!config || !config.views || !config.views[viewKey]) return

  const updatedViews = {
    ...config.views,
    [viewKey]: {
      ...config.views[viewKey],
      baseImage: newUrl
    }
  }

  const newConfig = { ...config, views: updatedViews }
  setConfig(newConfig)

  if (isEditing) autoSave(newConfig)
}


  const updateMobileCaseBaseImage = (modelIndex, newUrl) => {
    if (!config?.models?.[modelIndex]) return
    const newModels = [...config.models]
    newModels[modelIndex] = {
      ...newModels[modelIndex],
      view: { ...newModels[modelIndex].view, baseImage: newUrl }
    }
    const newConfig = { ...config, models: newModels }
    setConfig(newConfig)
    if (isEditing) autoSave(newConfig)
  }

  const updateReferenceImage = (viewKey, areaIndex, referenceIndex, newUrl) => {
    if (!config?.views?.[viewKey]?.areas?.[areaIndex]) return

    const areas = [...config.views[viewKey].areas]
    const refs = [...(areas[areaIndex].references || [])]

    if (referenceIndex >= 0 && referenceIndex < refs.length) {
      refs[referenceIndex] = newUrl
    } else {
      refs.push(newUrl)
    }

    areas[areaIndex] = { ...areas[areaIndex], references: refs }

    const newViews = {
      ...config.views,
      [viewKey]: { ...config.views[viewKey], areas }
    }

    const newConfig = { ...config, views: newViews }
    setConfig(newConfig)
    if (isEditing) autoSave(newConfig)
  }

  const updateMobileCaseReferenceImage = (modelIndex, areaIndex, referenceIndex, newUrl) => {
    if (!config?.models?.[modelIndex]?.view?.areas?.[areaIndex]) return

    const models = [...config.models]
    const areas = [...models[modelIndex].view.areas]
    const refs = [...(areas[areaIndex].references || [])]

    if (referenceIndex >= 0 && referenceIndex < refs.length) {
      refs[referenceIndex] = newUrl
    } else {
      refs.push(newUrl)
    }

    areas[areaIndex] = { ...areas[areaIndex], references: refs }
    models[modelIndex] = {
      ...models[modelIndex],
      view: { ...models[modelIndex].view, areas }
    }

    const newConfig = { ...config, models }
    setConfig(newConfig)
    if (isEditing) autoSave(newConfig)
  }

  const removeReferenceImage = (viewKey, areaIndex, referenceIndex) => {
    if (!config?.views?.[viewKey]?.areas?.[areaIndex]) return

    const areas = [...config.views[viewKey].areas]
    const refs = [...(areas[areaIndex].references || [])]
    refs.splice(referenceIndex, 1)

    areas[areaIndex] = { ...areas[areaIndex], references: refs }

    const newViews = {
      ...config.views,
      [viewKey]: { ...config.views[viewKey], areas }
    }

    const newConfig = { ...config, views: newViews }
    setConfig(newConfig)
    if (isEditing) autoSave(newConfig)
  }

  const removeMobileCaseReferenceImage = (modelIndex, areaIndex, referenceIndex) => {
    if (!config?.models?.[modelIndex]?.view?.areas?.[areaIndex]) return

    const models = [...config.models]
    const areas = [...models[modelIndex].view.areas]
    const refs = [...(areas[areaIndex].references || [])]
    refs.splice(referenceIndex, 1)

    areas[areaIndex] = { ...areas[areaIndex], references: refs }
    models[modelIndex] = {
      ...models[modelIndex],
      view: { ...models[modelIndex].view, areas }
    }

    const newConfig = { ...config, models }
    setConfig(newConfig)
    if (isEditing) autoSave(newConfig)
  }

  const handleFileChange = async (viewKey, areaIndex, referenceIndex, e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return

  const previewUrl = URL.createObjectURL(file)

  if (viewKey === "mobile") {
    if (areaIndex === null) {
      updateMobileCaseBaseImage(activeModelIndex, previewUrl)
    } else {
      updateMobileCaseReferenceImage(
        activeModelIndex,
        areaIndex,
        referenceIndex ?? -1,
        previewUrl
      )
    }
  } else {
    if (areaIndex === null) {
      updateBaseImage(viewKey, previewUrl)
    } else {
      updateReferenceImage(
        viewKey,
        areaIndex,
        referenceIndex ?? -1,
        previewUrl
      )
    }
  }

  try {
    const formData = new FormData()
    formData.append("images", file)

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/uploads/images`,
      {
        method: "POST",
        body: formData
      }
    )

    if (!res.ok) throw new Error("Upload failed")

    const json = await res.json()
    const realUrl = json?.data?.[0]?.url

    if (!realUrl) throw new Error("No URL from server")

    if (viewKey === "mobile") {
      if (areaIndex === null) {
        updateMobileCaseBaseImage(activeModelIndex, realUrl)
      } else {
        updateMobileCaseReferenceImage(
          activeModelIndex,
          areaIndex,
          referenceIndex ?? -1,
          realUrl
        )
      }
    } else {
      if (areaIndex === null) {
        updateBaseImage(viewKey, realUrl)
      } else {
        updateReferenceImage(
          viewKey,
          areaIndex,
          referenceIndex ?? -1,
          realUrl
        )
      }
    }

    URL.revokeObjectURL(previewUrl)
  } catch (err) {
    console.error("Upload error:", err)
    alert("Image upload failed — changes not saved")
  }
}


  const handleReplaceBaseImageClick = () => {
    baseImageInputRef.current?.click()
  }

  const handleReplaceReferenceClick = (areaIndex, referenceIndex) => {
    const prefix = isMobileCase ? "mobile" : activeView ?? "unknown"
    const modelIndex = isMobileCase ? activeModelIndex : 0
    const inputId = isMobileCase
      ? `ref-input-mobile-${modelIndex}-${areaIndex}-${referenceIndex}`
      : `ref-input-${prefix}-${areaIndex}-${referenceIndex}`

    document.getElementById(inputId)?.click()
  }

  const handleAddReferenceClick = (areaIndex) => {
    const prefix = isMobileCase ? "mobile" : activeView ?? "unknown"
    const modelIndex = isMobileCase ? activeModelIndex : 0
    const inputId = isMobileCase
      ? `add-ref-input-mobile-${modelIndex}-${areaIndex}`
      : `add-ref-input-${prefix}-${areaIndex}`

    document.getElementById(inputId)?.click()
  }

  const toggleReferences = (areaIndex) => {
    setExpandedArea(expandedArea === areaIndex ? null : areaIndex)
  }

  // Render
  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} onBack={() => router.push("/admin/print-config")} />
  if (!config) return null

  const views = !isMobileCase ? (config.views || {}) : {}
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
                <>
                  <Check className="w-4 h-4 mr-2" /> Editing Mode
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" /> Edit Images
                </>
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
            {/* MOBILE CASE SECTION */}
            {isMobileCase ? (
              <div>
                {config.models?.length ? (
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
                ) : null}

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

                    <ModelSpecifications model={config.models[activeModelIndex]} />

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
            ) : isGeneralPrint ? (
              /* GENERAL PRODUCT SECTION */
              <div className="space-y-6">
                <section className="border border-gray-200 rounded-xl p-6 bg-white">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Print Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-3">{config.area?.name}</h4>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p>
                          <span className="text-gray-600">Area ID:</span>{" "}
                          <code className="bg-white px-1.5 py-0.5 rounded font-mono text-xs">
                            {config.area?.id}
                          </code>
                        </p>
                        <p>
                          <span className="text-gray-600">Max Size:</span>{" "}
                          <span className="font-medium">{config.area?.max}</span>
                        </p>
                        <p>
                          <span className="text-gray-600">Type:</span>{" "}
                          <span className="capitalize font-medium">{config.area?.type}</span>
                        </p>
                        {config.area?.description && (
                          <p className="text-gray-600 pt-3 mt-3 border-t border-gray-200">
                            {config.area.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              /* REGULAR PRODUCTS (T-SHIRT, MUG, etc.) */
              <>
                {viewKeys.length === 0 ? (
                  <div className="text-center py-16">
                    <FileImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No views defined</h3>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-1">
                      {viewKeys.map((viewKey) => (
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
"use client"

import {
  getBanner,
  updateHomeBanner,
  updateDiscountBanner
} from "@/services/home-content.service"
import { useState, useCallback, useEffect } from "react"
import Cropper from "react-easy-crop"

const BANNER_WIDTH = 8063
const BANNER_HEIGHT = 2419
const ASPECT = BANNER_WIDTH / BANNER_HEIGHT

function getCroppedImg(imageSrc, cropPixels) {
  return new Promise((resolve) => {
    const image = new Image()
    image.src = imageSrc
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = BANNER_WIDTH
      canvas.height = BANNER_HEIGHT

      const ctx = canvas.getContext("2d")
      ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        BANNER_WIDTH,
        BANNER_HEIGHT
      )

      resolve(canvas.toDataURL("image/jpeg", 0.9))
    }
  })
}

function HomeBanner() {
  const [currentBanner, setCurrentBanner] = useState(null)
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropPixels, setCropPixels] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getBanner()
      .then(res => {
        if (res?.homeBanner?.imageUrl) {
          setCurrentBanner(res.homeBanner.imageUrl)
        }
      })
      .catch(() => {})
  }, [])

  const onCropComplete = useCallback((_, pixels) => {
    setCropPixels(pixels)
  }, [])

  const onSelectFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result)
    reader.readAsDataURL(file)
  }

  const saveCrop = async () => {
    if (!imageSrc || !cropPixels) return
    setSaving(true)

    const croppedBase64 = await getCroppedImg(imageSrc, cropPixels)
    const blob = await fetch(croppedBase64).then(r => r.blob())
    const file = new File([blob], "home-banner.jpg", {
      type: "image/jpeg"
    })

    const formData = new FormData()
    formData.append("bannerImage", file)

    const res = await updateHomeBanner(formData)
    setCurrentBanner(res.homeBanner.imageUrl)
    setImageSrc(null)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Current Banner</div>

      <div className="w-full h-65 md:h-90 rounded-xl border overflow-hidden bg-gray-100 flex items-center justify-center">
        {currentBanner ? (
          <img src={currentBanner} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm text-gray-500">
            Banner size required: 8063 × 2419
          </span>
        )}
      </div>

      <input type="file" accept="image/*" onChange={onSelectFile} />

      {imageSrc && (
        <div className="relative w-full h-105 bg-black rounded-xl overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            restrictPosition={false}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            <button
              onClick={saveCrop}
              disabled={saving}
              className="px-4 py-2 bg-white rounded-lg font-medium"
            >
              {saving ? "Saving..." : "Save Banner"}
            </button>
            <button
              onClick={() => setImageSrc(null)}
              className="px-4 py-2 bg-gray-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DiscountBanner() {
  const [enabled, setEnabled] = useState(true)
  const [messages, setMessages] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getBanner()
      .then(res => {
        if (res?.discountBanner) {
          setEnabled(res.discountBanner.enabled)
          setMessages(res .discountBanner.messages || [])
        }
      })
      .catch(() => {})
  }, [])

  const persist = async (nextEnabled, nextMessages) => {
    setSaving(true)
    await updateDiscountBanner({
      enabled: nextEnabled,
      messages: nextMessages
    })
    setSaving(false)
  }

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    persist(next, messages)
  }

  const updateMessage = (i, val) => {
    const copy = [...messages]
    copy[i] = val
    setMessages(copy)
    persist(enabled, copy)
  }

  const addMessage = () => {
    const copy = [...messages, ""]
    setMessages(copy)
    persist(enabled, copy)
  }

  const removeMessage = (i) => {
    const copy = messages.filter((_, index) => index !== i)
    setMessages(copy)
    persist(enabled, copy)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          Home Discount Banner (Text Slider)
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-600 transition">
            <div className="absolute top-[2px] left-[2px] h-5 w-5 bg-white rounded-full transition peer-checked:translate-x-5" />
          </div>
        </label>
      </div>

      <div
        className={`rounded-xl p-4 text-center font-semibold ${
          enabled ? "bg-black text-white" : "bg-gray-200 text-gray-500"
        }`}
      >
        {enabled && messages.length
          ? messages.join(" • ")
          : "Discount banner disabled"}
      </div>

      <div className="space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={msg}
              onChange={e => updateMessage(i, e.target.value)}
              disabled={!enabled}
              placeholder={`Message ${i + 1}`}
              className="flex-1 border rounded-lg px-3 py-2"
            />

            <button
              onClick={() => removeMessage(i)}
              disabled={!enabled}
              className="px-3 rounded-lg bg-red-100 text-red-600"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          onClick={addMessage}
          disabled={!enabled}
          className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium"
        >
          + Add Text Message
        </button>
      </div>

      {saving && (
        <div className="text-xs text-gray-500">
          Saving changes…
        </div>
      )}
    </div>
  )
}

export default function HomeContentManager() {
  const [active, setActive] = useState("homeBanner")

  return (
    <div className="flex gap-8">
      <aside className="w-64 p-4 space-y-2 bg-white">
        <button
          onClick={() => setActive("homeBanner")}
          className={`w-full px-3 py-2 rounded-lg text-left ${
            active === "homeBanner"
              ? "bg-black text-white"
              : "hover:bg-gray-100"
          }`}
        >
          Home Banner Image
        </button>

        <button
          onClick={() => setActive("discountBanner")}
          className={`w-full px-3 py-2 rounded-lg text-left ${
            active === "discountBanner"
              ? "bg-black text-white"
              : "hover:bg-gray-100"
          }`}
        >
          Home Discount Banner
        </button>
      </aside>

      <main className="flex-1 p-6 bg-white">
        {active === "homeBanner" && <HomeBanner />}
        {active === "discountBanner" && <DiscountBanner />}
      </main>
    </div>
  )
}

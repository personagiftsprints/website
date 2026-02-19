"use client"

import { useEffect, useState, useCallback } from "react"
import { X } from "lucide-react"

const CELEBRATIONS = [
  {
    id: "newyear",
    title: "Happy New Year!",
    subtitle: "Wishing you success and happiness this year.",
    emoji: "🎉",
    theme: "festive"
  },
  {
    id: "valentine",
    title: "Happy Valentine's Day!",
    subtitle: "Spread love and kindness today.",
    emoji: "❤️",
    theme: "warm"
  },
  {
    id: "womensday",
    title: "International Women's Day",
    subtitle: "Celebrating strength and equality.",
    emoji: "🌸",
    theme: "nature"
  },
  {
    id: "earthday",
    title: "Happy Earth Day!",
    subtitle: "Let's protect our planet together.",
    emoji: "🌍",
    theme: "nature"
  },
  {
    id: "childrensday",
    title: "Happy Children's Day!",
    subtitle: "Celebrate joy and innocence.",
    emoji: "🎈",
    theme: "festive"
  },
  {
    id: "halloween",
    title: "Happy Halloween!",
    subtitle: "Have a spooky and fun night!",
    emoji: "🎃",
    theme: "cool"
  },
  {
    id: "christmas",
    title: "Merry Christmas!",
    subtitle: "Wishing you peace and joy.",
    emoji: "🎄",
    theme: "festive"
  }
]

const THEMES = {
  warm: {
    gradient: "from-orange-400 to-pink-500",
    button: "bg-pink-600 hover:bg-pink-700"
  },
  cool: {
    gradient: "from-purple-400 to-indigo-500",
    button: "bg-indigo-600 hover:bg-indigo-700"
  },
  festive: {
    gradient: "from-red-400 to-yellow-500",
    button: "bg-red-600 hover:bg-red-700"
  },
  nature: {
    gradient: "from-green-400 to-teal-500",
    button: "bg-teal-600 hover:bg-teal-700"
  }
}

const CELEBRATION_DATES = {
  newyear: { month: 1, day: 1 },
  valentine: { month: 2, day: 14 },
  earthday: { month: 4, day: 22 },
  halloween: { month: 10, day: 31 },
  christmas: { month: 12, day: 25 }
}

function getTodaysCelebration() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()
  const currentYear = now.getFullYear()

  const celebrationId = Object.entries(CELEBRATION_DATES).find(
    ([_, value]) =>
      value.month === currentMonth && value.day === currentDay
  )?.[0]

  if (!celebrationId) return null

  const celebration = CELEBRATIONS.find(c => c.id === celebrationId)
  if (!celebration) return null

  return {
    ...celebration,
    id: `${celebrationId}-${currentYear}`
  }
}

export default function CelebrationOverlay({
  onShopNow,
  autoShow = true
}) {
  const [event, setEvent] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!autoShow) return

    const celebration = getTodaysCelebration()
    if (!celebration) return

    const storageKey = `celebration-${celebration.id}`
    const alreadyShown = localStorage.getItem(storageKey)

    if (!alreadyShown) {
      setEvent(celebration)
      setIsVisible(true)
    }
  }, [autoShow])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsClosing(false)
    }, 300)
  }, [])

  const handleAction = useCallback(() => {
    if (!event) return

    localStorage.setItem(`celebration-${event.id}`, "true")
    if (onShopNow) onShopNow()
    handleClose()
  }, [event, onShopNow, handleClose])

  const handleDismiss = useCallback(() => {
    if (!event) return

    localStorage.setItem(`celebration-${event.id}`, "true")
    handleClose()
  }, [event, handleClose])

  if (!event || !isVisible) return null

  const theme = THEMES[event.theme]

  return (
    <div
      className={`
        fixed inset-0 z-9999 flex items-center justify-center p-4
        transition-all duration-300
        ${isClosing ? "opacity-0" : "opacity-100"}
      `}
      style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
    >
      <div
        className={`
          relative w-full max-w-md rounded-2xl bg-white shadow-2xl
          transform transition-all duration-300
          ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"}
        `}
      >
        <div
          className={`
            relative h-24 rounded-t-2xl bg-linear-to-r ${theme.gradient}
            flex items-center justify-center
          `}
        >
          <span className="text-6xl ">
            {event.emoji}
          </span>
        </div>

  

        <div className="p-8 pt-6">
          <h2 className="text-2xl font-bold text-center mb-2">
            {event.title}
          </h2>

          <p className="text-gray-600 text-center mb-6">
            {event.subtitle}
          </p>

          <div className="space-y-3">
            <button
              onClick={handleAction}
              className={`
                w-full py-3 px-4 rounded-lg font-medium text-white
                transition-all duration-200 transform hover:scale-[1.02]
                active:scale-[0.98]
                ${theme.button}
              `}
            >
              Shop Now
            </button>

         
          </div>
        </div>
      </div>
    </div>
  )
}
